"""
VeriChain-IA  ·  Avance 3 – Innovación y Transformación Digital (100000TD09)
Módulo de Inteligencia Artificial del prototipo VeriChain.

Componentes:
  1. Espacio de problemas del flujo de verificación + búsqueda (BFS, UCS, A*).
  2. Dataset sintético de metadatos de credenciales PDF (adulterada / auténtica).
  3. Modelos supervisados: Regresión logística, KNN, SVM, Árbol de decisión, Gradient Boosting.
  4. Clustering K-Means de perfiles de entidades verificadoras.

Ejecutar:  python verichain_ia.py      (genera ./figuras/*.png y ./resultados/*.csv)
Requisitos: numpy, pandas, scikit-learn, matplotlib, networkx
"""
import heapq, time, json, os
from collections import deque
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
                             roc_auc_score, roc_curve, confusion_matrix)
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

SEED = 42
rng = np.random.default_rng(SEED)
os.makedirs("figuras", exist_ok=True)
os.makedirs("resultados", exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})
AZUL, NARANJA, GRIS, VERDE, ROJO, MORADO = "#2b6cb0", "#dd6b20", "#a0aec0", "#2f855a", "#c53030", "#6b46c1"

# ----------------------------------------------------------------------------
# 1. ESPACIO DE PROBLEMAS Y BÚSQUEDA
# ----------------------------------------------------------------------------
ESTADOS = {
    "S0": "Solicitud recibida",
    "S1": "QR decodificado (ID)",
    "S2": "PDF cargado sin QR",
    "S3": "Registro localizado en BD",
    "S4": "Hash SHA-256 calculado",
    "S5": "Evidencia vía índice off-chain",
    "S6": "Evidencia vía nodo RPC",
    "S7": "Firma digital verificada",
    "S8": "Estado de revocación conocido",
    "G":  "Veredicto emitido",
}
# (origen, destino, operador, costo estimado en ms)
ARISTAS = [
    ("S0", "S1", "decodificar_QR", 40),
    ("S0", "S2", "cargar_PDF", 150),
    ("S1", "S3", "buscar_registro_BD", 25),
    ("S2", "S4", "calcular_hash", 60),
    ("S3", "S4", "calcular_hash", 60),
    ("S4", "S5", "consultar_indice_offchain", 35),
    ("S4", "S6", "consultar_nodo_RPC", 320),
    ("S4", "S8", "consulta_integral_RPC", 650),
    ("S5", "S7", "verificar_firma", 45),
    ("S6", "S7", "verificar_firma", 45),
    ("S7", "S8", "consultar_revocacion", 30),
    ("S8", "G",  "emitir_veredicto", 10),
]
GRAFO = {}
for o, d, op, c in ARISTAS:
    GRAFO.setdefault(o, []).append((d, op, c))
GRAFO.setdefault("G", [])

def saltos_minimos_a_meta():
    inv = {}
    for o, d, _, _ in ARISTAS:
        inv.setdefault(d, []).append(o)
    dist, cola = {"G": 0}, deque(["G"])
    while cola:
        n = cola.popleft()
        for p in inv.get(n, []):
            if p not in dist:
                dist[p] = dist[n] + 1
                cola.append(p)
    return dist

SALTOS = saltos_minimos_a_meta()
COSTO_MIN_OPERADOR = min(c for *_, c in ARISTAS)          # 10 ms

# Heurística por etapas obligatorias pendientes (problema relajado): suma del costo mínimo de
# (a) identificar la credencial 40, (b) calcular hash 60, (c) obtener evidencia + firma + revocación
# min(35+45+30, 650)=110 y (d) emitir veredicto 10. Nunca sobreestima -> admisible y consistente.
H_ETAPAS = {"S0": 220, "S1": 180, "S2": 180, "S3": 180, "S4": 120,
            "S5": 85, "S6": 85, "S7": 40, "S8": 10, "G": 0}
def h(n):
    return H_ETAPAS[n]

def costo_ruta(ruta):
    total = 0
    for a, b in zip(ruta, ruta[1:]):
        total += next(c for d, _, c in GRAFO[a] if d == b)
    return total

def bfs(inicio="S0", meta="G"):
    frontera, padres, orden = deque([inicio]), {inicio: None}, []
    while frontera:
        n = frontera.popleft(); orden.append(n)
        if n == meta: break
        for d, _, _ in GRAFO[n]:
            if d not in padres:
                padres[d] = n; frontera.append(d)
    ruta, n = [], meta
    while n: ruta.append(n); n = padres[n]
    return ruta[::-1], orden

def busqueda_costo(inicio="S0", meta="G", usar_h=False):
    """UCS si usar_h=False; A* si usar_h=True. Devuelve ruta, orden de expansión y traza."""
    g = {inicio: 0}
    frontera = [(h(inicio) if usar_h else 0, 0, inicio)]
    padres, cerrados, orden, traza, k = {inicio: None}, set(), [], [], 1
    while frontera:
        f, _, n = heapq.heappop(frontera)
        if n in cerrados: continue
        cerrados.add(n); orden.append(n)
        traza.append({"paso": len(orden), "expande": n, "g(n)": g[n],
                      "h(n)": h(n) if usar_h else 0, "f(n)": g[n] + (h(n) if usar_h else 0)})
        if n == meta: break
        for d, _, c in GRAFO[n]:
            ng = g[n] + c
            if ng < g.get(d, float("inf")):
                g[d] = ng; padres[d] = n
                heapq.heappush(frontera, (ng + (h(d) if usar_h else 0), k, d)); k += 1
    ruta, n = [], meta
    while n: ruta.append(n); n = padres[n]
    return ruta[::-1], orden, traza

res_busqueda = {}
for nombre, fn in [("BFS", lambda: bfs()),
                   ("Costo uniforme (UCS)", lambda: busqueda_costo(usar_h=False)[:2]),
                   ("A*", lambda: busqueda_costo(usar_h=True)[:2])]:
    t0 = time.perf_counter()
    for _ in range(2000): ruta, orden = fn()
    t = (time.perf_counter() - t0) / 2000 * 1e6
    res_busqueda[nombre] = {"ruta": " → ".join(ruta), "costo_ms": costo_ruta(ruta),
                            "nodos_expandidos": len(orden), "tiempo_us": round(t, 1)}
_, _, traza_astar = busqueda_costo(usar_h=True)
pd.DataFrame(res_busqueda).T.to_csv("resultados/busqueda_comparacion.csv")
pd.DataFrame(traza_astar).to_csv("resultados/traza_astar.csv", index=False)
print(json.dumps(res_busqueda, indent=1, ensure_ascii=False))
print(pd.DataFrame(traza_astar).to_string(index=False))
print("h:", {n: h(n) for n in ESTADOS})

# Figura 1: grafo del espacio de estados
G = nx.DiGraph()
for o, d, op, c in ARISTAS: G.add_edge(o, d, op=op, c=c)
pos = {"S0": (0, 1), "S1": (1.3, 2), "S2": (1.8, 0), "S3": (2.6, 2), "S4": (3.6, 1),
       "S5": (4.9, 2), "S6": (4.9, 0), "S7": (6.2, 2), "S8": (7.3, 1), "G": (8.5, 1)}
CODIGO = {(o, d): f"O{i+1}" for i, (o, d, _, _) in enumerate(ARISTAS)}
ruta_a = res_busqueda["A*"]["ruta"].split(" → ")
ruta_b = res_busqueda["BFS"]["ruta"].split(" → ")
ea = set(zip(ruta_a, ruta_a[1:])); eb = set(zip(ruta_b, ruta_b[1:]))
fig, ax = plt.subplots(figsize=(13, 5.4))
otras = [e for e in G.edges if e not in ea and e not in eb]
nx.draw_networkx_edges(G, pos, edgelist=otras, edge_color=GRIS, width=1.2, arrowsize=14, ax=ax,
                       node_size=2600, connectionstyle="arc3,rad=0.0")
nx.draw_networkx_edges(G, pos, edgelist=list(eb - ea), edge_color=NARANJA, width=2.4, style="dashed",
                       arrowsize=16, ax=ax, node_size=2600)
nx.draw_networkx_edges(G, pos, edgelist=list(ea), edge_color=AZUL, width=2.8, arrowsize=16, ax=ax,
                       node_size=2600)
colores = [VERDE if n == "G" else ("#ebf4ff" if n in ruta_a else "#f7fafc") for n in G.nodes]
nx.draw_networkx_nodes(G, pos, node_color=colores, edgecolors="#4a5568", node_size=2600, ax=ax)
nx.draw_networkx_labels(G, pos, {n: n for n in G.nodes}, font_weight="bold", ax=ax)
for n, (x, y) in pos.items():
    ax.text(x, y - 0.3, ESTADOS[n], ha="center", va="top", fontsize=8, color="#2d3748", wrap=True)
nx.draw_networkx_edge_labels(G, pos, {("S4", "S8"): "O8 · 650 ms"}, font_size=8, ax=ax, label_pos=0.25,
                             bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.9))
nx.draw_networkx_edge_labels(G, pos, {(o, d): f"{CODIGO[(o, d)]} · {c} ms" for o, d, op, c in ARISTAS if (o, d) != ("S4", "S8")},
                             font_size=8, ax=ax, label_pos=0.5,
                             bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.85))
ax.plot([], [], color=AZUL, lw=2.8, label=f"Ruta A* ({res_busqueda['A*']['costo_ms']} ms)")
ax.plot([], [], color=NARANJA, lw=2.4, ls="--", label=f"Ruta BFS ({res_busqueda['BFS']['costo_ms']} ms)")
ax.legend(loc="lower right", frameon=False)
ax.set_title("Espacio de estados del flujo de verificación de VeriChain", loc="left", fontweight="bold")
ax.axis("off"); ax.set_ylim(-0.55, 2.35); ax.set_xlim(-0.5, 9)
plt.tight_layout(); plt.savefig("figuras/fig1_espacio_estados.png", bbox_inches="tight"); plt.close()

# ----------------------------------------------------------------------------
# 2. DATASET SINTÉTICO DE CREDENCIALES PDF
# ----------------------------------------------------------------------------
N = 2000
y = (rng.random(N) < 0.30).astype(int)          # 30 % adulteradas
def mezcla(a_auth, a_alt):                      # genera según la clase
    return np.where(y == 1, a_alt, a_auth)
df = pd.DataFrame({
    "horas_creacion_modificacion": mezcla(rng.exponential(0.4, N), rng.exponential(60, N)).round(2),
    "actualizaciones_incrementales": mezcla(rng.poisson(0.15, N), rng.poisson(1.4, N)),
    "productor_coincide": mezcla(rng.random(N) < 0.95, rng.random(N) < 0.45).astype(int),
    "fuentes_fuera_plantilla": mezcla(rng.poisson(0.2, N), rng.poisson(1.3, N)),
    "objetos_imagen_superpuestos": mezcla(rng.poisson(0.3, N), rng.poisson(1.2, N)),
    "firma_digital_presente": mezcla(rng.random(N) < 0.80, rng.random(N) < 0.50).astype(int),
    "tamano_kb": mezcla(rng.normal(310, 60, N), rng.normal(380, 110, N)).round(0).clip(80),
    "dias_desde_emision": rng.integers(1, 1800, N),
})
# Ruido de etiquetado (5 %) para emular casos ambiguos reales
ruido = rng.random(N) < 0.05
df["adulterada"] = np.where(ruido, 1 - y, y)
df.to_csv("resultados/dataset_credenciales_sintetico.csv", index=False)
X, Y = df.drop(columns="adulterada"), df["adulterada"]
print("\nDataset:", df.shape, "prevalencia adulteradas:", round(Y.mean(), 3))
print(df.describe().T.round(2).to_string())
print(df.groupby("adulterada").mean().T.round(2).to_string())

Xtr, Xte, ytr, yte = train_test_split(X, Y, test_size=0.25, stratify=Y, random_state=SEED)

modelos = {
    "Regresión logística": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced")),
    "KNN (k=7)": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=7)),
    "SVM (RBF)": make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0, probability=True, class_weight="balanced", random_state=SEED)),
    "Árbol de decisión": DecisionTreeClassifier(max_depth=4, class_weight="balanced", random_state=SEED),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=150, max_depth=3, learning_rate=0.1, random_state=SEED),
}
filas, probas = [], {}
skf = StratifiedKFold(5, shuffle=True, random_state=SEED)
for nombre, m in modelos.items():
    t0 = time.perf_counter(); m.fit(Xtr, ytr); t_ent = (time.perf_counter() - t0) * 1000
    t0 = time.perf_counter(); p = m.predict_proba(Xte)[:, 1]; t_inf = (time.perf_counter() - t0) * 1000
    yp = (p >= 0.5).astype(int); probas[nombre] = p
    cv = cross_val_score(m, X, Y, cv=skf, scoring="f1")
    filas.append({"Modelo": nombre, "Accuracy": accuracy_score(yte, yp), "Precisión": precision_score(yte, yp),
                  "Recall": recall_score(yte, yp), "F1": f1_score(yte, yp), "AUC-ROC": roc_auc_score(yte, p),
                  "F1 CV (media)": cv.mean(), "F1 CV (desv.)": cv.std(),
                  "Entrenamiento (ms)": t_ent, "Inferencia 500 docs (ms)": t_inf})
res = pd.DataFrame(filas).set_index("Modelo")
res.round(3).to_csv("resultados/comparacion_modelos.csv")
print("\n", res.round(3).to_string())

lr = modelos["Regresión logística"]
coef = pd.Series(lr[-1].coef_[0], index=X.columns).sort_values()
print("\nCoeficientes RL (estandarizados):\n", coef.round(3).to_string(), "\nOR:", np.exp(coef).round(2).to_dict())
gb = modelos["Gradient Boosting"]
imp = pd.Series(gb.feature_importances_, index=X.columns).sort_values()
print("\nImportancias GB:\n", imp.round(3).to_string())
for nombre in ["Regresión logística", "Gradient Boosting"]:
    print(nombre, "matriz de confusión:\n", confusion_matrix(yte, (probas[nombre] >= .5).astype(int)))

ETQ = {"horas_creacion_modificacion": "Horas creación→modificación", "actualizaciones_incrementales": "Actualizaciones incrementales",
       "productor_coincide": "Software productor coincide", "fuentes_fuera_plantilla": "Fuentes fuera de plantilla",
       "objetos_imagen_superpuestos": "Imágenes superpuestas", "firma_digital_presente": "Firma digital presente",
       "tamano_kb": "Tamaño (KB)", "dias_desde_emision": "Días desde emisión"}

# Figura 2: matriz de confusión + coeficientes RL
fig, axs = plt.subplots(1, 2, figsize=(11.5, 4.2), gridspec_kw={"width_ratios": [1, 1.5]})
cm = confusion_matrix(yte, (probas["Regresión logística"] >= .5).astype(int))
axs[0].imshow(cm, cmap="Blues")
for i in range(2):
    for j in range(2):
        axs[0].text(j, i, cm[i, j], ha="center", va="center", fontsize=15, fontweight="bold",
                    color="white" if cm[i, j] > cm.max() / 2 else "#1a202c")
axs[0].set_xticks([0, 1], ["Auténtica", "Adulterada"]); axs[0].set_yticks([0, 1], ["Auténtica", "Adulterada"])
axs[0].set_xlabel("Predicción"); axs[0].set_ylabel("Clase real")
axs[0].set_title("a) Matriz de confusión (prueba, n=500)", loc="left", fontsize=10.5, fontweight="bold")
c = coef.rename(index=ETQ)
axs[1].barh(c.index, c.values, color=[ROJO if v > 0 else AZUL for v in c.values])
axs[1].axvline(0, color="#4a5568", lw=0.8)
for i, v in enumerate(c.values):
    axs[1].text(v + (0.05 if v > 0 else -0.05), i, f"{v:+.2f}", va="center", ha="left" if v > 0 else "right", fontsize=8.5)
axs[1].set_xlabel("Coeficiente estandarizado (log-odds)")
axs[1].set_title("b) Peso de cada atributo en la regresión logística", loc="left", fontsize=10.5, fontweight="bold")
axs[1].set_xlim(c.min() - 0.6, c.max() + 0.6)
plt.tight_layout(); plt.savefig("figuras/fig2_regresion_logistica.png", bbox_inches="tight"); plt.close()

# Figura 3: fronteras de decisión con los dos atributos más informativos
f1n, f2n = "actualizaciones_incrementales", "horas_creacion_modificacion"
X2 = X[[f1n, f2n]].copy(); X2[f2n] = np.log1p(X2[f2n])
X2tr, X2te, y2tr, y2te = train_test_split(X2, Y, test_size=0.25, stratify=Y, random_state=SEED)
m2 = {"Regresión logística": make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced")),
      "SVM (RBF)": make_pipeline(StandardScaler(), SVC(kernel="rbf", class_weight="balanced")),
      "Gradient Boosting": GradientBoostingClassifier(n_estimators=150, max_depth=3, random_state=SEED)}
xx, yy = np.meshgrid(np.linspace(-0.5, X2[f1n].max() + 0.5, 300), np.linspace(-0.2, X2[f2n].max() + 0.3, 300))
grid = pd.DataFrame({f1n: xx.ravel(), f2n: yy.ravel()})
fig, axs = plt.subplots(1, 3, figsize=(13, 4.2), sharey=True)
jit = rng.normal(0, 0.12, len(X2te))
for ax, (nombre, m) in zip(axs, m2.items()):
    m.fit(X2tr, y2tr); zz = m.predict(grid).reshape(xx.shape)
    ax.contourf(xx, yy, zz, levels=[-0.5, 0.5, 1.5], colors=["#ebf4ff", "#fde8e8"], alpha=0.9)
    ax.contour(xx, yy, zz, levels=[0.5], colors="#4a5568", linewidths=1)
    ax.scatter(X2te[f1n][y2te == 0] + jit[y2te.values == 0], X2te[f2n][y2te == 0], s=9, c=AZUL, alpha=.6, label="Auténtica")
    ax.scatter(X2te[f1n][y2te == 1] + jit[y2te.values == 1], X2te[f2n][y2te == 1], s=9, c=ROJO, alpha=.6, label="Adulterada")
    acc = accuracy_score(y2te, m.predict(X2te))
    ax.set_title(f"{nombre}  ·  accuracy 2D = {acc:.2f}", loc="left", fontsize=10, fontweight="bold")
    ax.set_xlabel("Actualizaciones incrementales del PDF")
axs[0].set_ylabel("log(1 + horas creación→modificación)")
axs[0].legend(loc="upper right", frameon=True, fontsize=8)
plt.tight_layout(); plt.savefig("figuras/fig3_fronteras_decision.png", bbox_inches="tight"); plt.close()

# Figura 4: comparación de modelos (ROC + F1/tiempo)
fig, axs = plt.subplots(1, 2, figsize=(12, 4.4))
cols = {"Regresión logística": AZUL, "KNN (k=7)": GRIS, "SVM (RBF)": MORADO, "Árbol de decisión": VERDE, "Gradient Boosting": NARANJA}
for nombre, p in probas.items():
    fpr, tpr, _ = roc_curve(yte, p)
    axs[0].plot(fpr, tpr, color=cols[nombre], lw=2, label=f"{nombre} (AUC {roc_auc_score(yte, p):.3f})")
axs[0].plot([0, 1], [0, 1], ls=":", color="#718096")
axs[0].set_xlabel("Tasa de falsos positivos"); axs[0].set_ylabel("Tasa de verdaderos positivos")
axs[0].set_title("a) Curvas ROC en el conjunto de prueba", loc="left", fontsize=10.5, fontweight="bold")
axs[0].legend(loc="lower right", fontsize=8, frameon=False)
for nombre, r in res.iterrows():
    axs[1].scatter(r["Entrenamiento (ms)"], r["F1"], s=120, color=cols[nombre], edgecolor="#2d3748", zorder=3)
    axs[1].errorbar(r["Entrenamiento (ms)"], r["F1 CV (media)"], yerr=r["F1 CV (desv.)"], fmt="none", ecolor=cols[nombre], alpha=.6)
    axs[1].annotate(nombre, (r["Entrenamiento (ms)"], r["F1"]), xytext=(8, 6), textcoords="offset points", fontsize=8.5)
axs[1].set_xscale("log"); axs[1].set_xlabel("Tiempo de entrenamiento (ms, escala log)"); axs[1].set_ylabel("F1 (prueba)")
axs[1].set_title("b) Desempeño frente a costo de entrenamiento", loc="left", fontsize=10.5, fontweight="bold")
plt.tight_layout(); plt.savefig("figuras/fig4_comparacion_modelos.png", bbox_inches="tight"); plt.close()

# ----------------------------------------------------------------------------
# 3. CLUSTERING K-MEANS DE ENTIDADES VERIFICADORAS
# ----------------------------------------------------------------------------
def grupo(n, vol, pct_inv, hora, inst, intervalo):
    return pd.DataFrame({"verificaciones_mes": rng.normal(*vol, n).clip(1),
                         "pct_no_validas": rng.normal(*pct_inv, n).clip(0, 100),
                         "hora_media_consulta": rng.normal(*hora, n).clip(0, 23.9),
                         "instituciones_distintas": rng.normal(*inst, n).clip(1),
                         "intervalo_medio_min": rng.normal(*intervalo, n).clip(0.05)})
ver = pd.concat([grupo(230, (140, 30), (4, 2), (11, 1.5), (14, 4), (140, 40)),   # reclutadores corporativos
                 grupo(270, (8, 4), (6, 3), (15, 2.5), (3, 1.5), (2600, 800)),     # pymes / ocasionales
                 grupo(70, (55, 15), (12, 4), (10, 1.2), (30, 6), (420, 120)),     # instituciones académicas
                 grupo(30, (420, 90), (38, 9), (3, 2), (45, 10), (3, 1.5))],       # patrón anómalo
                ignore_index=True)
ver.round(2).to_csv("resultados/verificadores_sintetico.csv", index=False)
Xv = StandardScaler().fit_transform(np.column_stack([np.log1p(ver["verificaciones_mes"]), ver["pct_no_validas"],
                                                     ver["hora_media_consulta"], ver["instituciones_distintas"],
                                                     np.log1p(ver["intervalo_medio_min"])]))
ks, inercias, sils = range(2, 9), [], []
for k in ks:
    km = KMeans(k, n_init=20, random_state=SEED).fit(Xv)
    inercias.append(km.inertia_); sils.append(silhouette_score(Xv, km.labels_))
print("\nInercia:", dict(zip(ks, np.round(inercias, 1))), "\nSilueta:", dict(zip(ks, np.round(sils, 3))))
K = 4
km = KMeans(K, n_init=20, random_state=SEED).fit(Xv)
ver["cluster"] = km.labels_
perfil = ver.groupby("cluster").agg(n=("cluster", "size"), **{c: (c, "mean") for c in ver.columns if c != "cluster"}).round(1)
print(perfil.to_string())

def nombre_cluster(r):
    if r["pct_no_validas"] > 25: return "Patrón anómalo (posible scraping)"
    if r["verificaciones_mes"] > 100: return "Reclutadores de alto volumen"
    if r["instituciones_distintas"] > 20: return "Instituciones académicas"
    return "Verificadores ocasionales"
nombres = {c: nombre_cluster(r) for c, r in perfil.iterrows()}
perfil.insert(0, "segmento", perfil.index.map(nombres))
perfil.to_csv("resultados/perfil_clusters.csv")
print(perfil.to_string())

fig, axs = plt.subplots(1, 2, figsize=(12.5, 4.6), gridspec_kw={"width_ratios": [1, 1.5]})
ax2 = axs[0].twinx()
axs[0].plot(list(ks), inercias, "o-", color=AZUL, lw=2, label="Inercia (codo)")
ax2.plot(list(ks), sils, "s--", color=NARANJA, lw=2, label="Coef. de silueta")
axs[0].axvline(K, color="#4a5568", ls=":", lw=1)
axs[0].set_xlabel("Número de clusters k"); axs[0].set_ylabel("Inercia (WCSS)", color=AZUL); ax2.set_ylabel("Silueta", color=NARANJA)
ax2.spines["right"].set_visible(True)
axs[0].set_title("a) Selección de k: codo y silueta", loc="left", fontsize=10.5, fontweight="bold")
pca = PCA(2, random_state=SEED).fit(Xv); P = pca.transform(Xv); C = pca.transform(km.cluster_centers_)
pal = [AZUL, VERDE, MORADO, ROJO]
orden_c = sorted(nombres, key=lambda c: ["Reclutadores de alto volumen", "Verificadores ocasionales", "Instituciones académicas", "Patrón anómalo (posible scraping)"].index(nombres[c]))
for col, c in zip(pal, orden_c):
    msk = km.labels_ == c
    axs[1].scatter(P[msk, 0], P[msk, 1], s=14, alpha=.65, color=col, label=f"{nombres[c]} (n={msk.sum()})")
    axs[1].scatter(*C[c], marker="X", s=200, color=col, edgecolor="black", zorder=4)
axs[1].set_xlabel(f"Componente principal 1 ({pca.explained_variance_ratio_[0]*100:.0f} % var.)")
axs[1].set_ylabel(f"Componente principal 2 ({pca.explained_variance_ratio_[1]*100:.0f} % var.)")
axs[1].set_title("b) Segmentos de verificadores (K-Means, k = 4, proyección PCA)", loc="left", fontsize=10.5, fontweight="bold")
axs[1].legend(fontsize=8, frameon=False, loc="best")
plt.tight_layout(); plt.savefig("figuras/fig5_kmeans.png", bbox_inches="tight"); plt.close()
print("\nPCA var:", pca.explained_variance_ratio_.round(3))
