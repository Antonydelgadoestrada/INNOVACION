// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialRegistry
 * @dev Contrato inteligente para registrar la evidencia criptográfica y el estado
 *      de credenciales académicas en VeriChain (Innovación y Transformación Digital).
 *
 * REGLA ESTRICTA DE PRIVACIDAD:
 * En este contrato NO se almacena ningún dato personal ni el documento completo.
 * Únicamente se registran: el identificador público (bytes32), el hash de los datos canónicos,
 * el hash del archivo PDF, la dirección del emisor, la marca de tiempo y el estado de revocación.
 */
contract CredentialRegistry {
    // Propietario del contrato (administrador de la plataforma para autorizar emisores si aplica)
    address public owner;

    // Estructura que almacena la evidencia criptográfica inmutable
    struct CredentialRecord {
        bytes32 dataHash;       // SHA-256 del JSON canónico de datos con sal
        bytes32 fileHash;       // SHA-256 del archivo PDF final
        address issuer;         // Dirección de la institución / billetera que emitió la credencial
        uint256 timestamp;      // Fecha y hora del registro en la red (block.timestamp)
        bool isRevoked;         // Indica si la credencial fue revocada
        uint256 revokedAt;      // Fecha y hora de la revocación (0 si no está revocada)
    }

    // Mapeo del identificador único de la credencial a su registro criptográfico
    mapping(bytes32 => CredentialRecord) private credentials;

    // Mapeo de direcciones autorizadas para emitir credenciales
    mapping(address => bool) public authorizedIssuers;

    // Eventos emitidos para trazabilidad e indexación en exploradores de bloques
    event CredentialRegistered(
        bytes32 indexed id,
        bytes32 indexed dataHash,
        bytes32 fileHash,
        address indexed issuer,
        uint256 timestamp
    );

    event CredentialRevoked(
        bytes32 indexed id,
        address indexed issuer,
        uint256 revokedAt
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerDeauthorized(address indexed issuer);

    // Modificadores de control de acceso
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el administrador puede ejecutar esta accion");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "Direccion no autorizada para registrar credenciales"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        // El creador queda autorizado por defecto
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    /**
     * @dev Autoriza o desautoriza una dirección emisora (para el prototipo y escalabilidad)
     */
    function setAuthorizedIssuer(address issuerAddress, bool authorized) external onlyOwner {
        require(issuerAddress != address(0), "Direccion invalida");
        authorizedIssuers[issuerAddress] = authorized;
        if (authorized) {
            emit IssuerAuthorized(issuerAddress);
        } else {
            emit IssuerDeauthorized(issuerAddress);
        }
    }

    /**
     * @dev Registra una nueva credencial en la blockchain.
     * @param id Identificador único de la credencial (formateado en bytes32).
     * @param dataHash Hash SHA-256 de los datos canónicos con sal.
     * @param fileHash Hash SHA-256 del archivo PDF generado con QR incrustado.
     */
    function register(
        bytes32 id,
        bytes32 dataHash,
        bytes32 fileHash
    ) external onlyAuthorized {
        require(id != bytes32(0), "Identificador no puede estar vacio");
        require(dataHash != bytes32(0), "Hash de datos no puede estar vacio");
        require(fileHash != bytes32(0), "Hash de archivo no puede estar vacio");
        require(credentials[id].timestamp == 0, "La credencial con este ID ya ha sido registrada");

        credentials[id] = CredentialRecord({
            dataHash: dataHash,
            fileHash: fileHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false,
            revokedAt: 0
        });

        emit CredentialRegistered(id, dataHash, fileHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Revoca una credencial previamente emitida.
     *      Solo la dirección que emitió la credencial (o el propietario) puede revocarla.
     * @param id Identificador de la credencial a revocar.
     */
    function revoke(bytes32 id) external {
        CredentialRecord storage record = credentials[id];
        require(record.timestamp != 0, "La credencial no existe en el registro");
        require(!record.isRevoked, "La credencial ya se encuentra revocada");
        require(
            msg.sender == record.issuer || msg.sender == owner,
            "Solo el emisor original puede revocar esta credencial"
        );

        record.isRevoked = true;
        record.revokedAt = block.timestamp;

        emit CredentialRevoked(id, msg.sender, block.timestamp);
    }

    /**
     * @dev Consulta la información completa de una credencial.
     * @param id Identificador de la credencial.
     * @return dataHash Hash SHA-256 de los datos canónicos
     * @return fileHash Hash SHA-256 del archivo PDF
     * @return issuer Dirección de la institución emisora
     * @return timestamp Fecha y hora de registro
     * @return isRevoked Indica si está revocada
     * @return revokedAt Fecha de revocación (0 si está activa)
     */
    function get(bytes32 id)
        external
        view
        returns (
            bytes32 dataHash,
            bytes32 fileHash,
            address issuer,
            uint256 timestamp,
            bool isRevoked,
            uint256 revokedAt
        )
    {
        CredentialRecord memory record = credentials[id];
        require(record.timestamp != 0, "Credencial no encontrada");
        return (
            record.dataHash,
            record.fileHash,
            record.issuer,
            record.timestamp,
            record.isRevoked,
            record.revokedAt
        );
    }

    /**
     * @dev Función de verificación rápida de existencia sin revertir si no existe.
     * @param id Identificador de la credencial.
     */
    function exists(bytes32 id) external view returns (bool) {
        return credentials[id].timestamp != 0;
    }
}
