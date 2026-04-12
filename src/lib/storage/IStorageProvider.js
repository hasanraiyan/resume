/**
 * Interface/Base class for Storage Providers.
 * Ensures all providers implement necessary methods for the Vaultly Drive App.
 */
export default class IStorageProvider {
  /**
   * Upload a file buffer directly (Server-side upload)
   * @param {Buffer} buffer - The file buffer
   * @param {string} fileName - The name of the file
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<{ url: string, fileKey: string }>}
   */
  async upload(buffer, fileName, mimeType) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete a file by its key
   * @param {string} fileKey - The key of the file to delete
   * @returns {Promise<boolean>}
   */
  async delete(fileKey) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get public or signed URL for a file
   * @param {string} fileKey - The key of the file
   * @returns {Promise<string>}
   */
  async getUrl(fileKey) {
    throw new Error('Method not implemented.');
  }

  /**
   * Return the provider's capabilities
   * @returns {{ supportsFolders: boolean, supportsSignedUrls: boolean, requiresDirectUpload: boolean }}
   */
  getCapabilities() {
    throw new Error('Method not implemented.');
  }

  /**
   * Get an upload intent (presigned URL or config) for hybrid client-side direct upload
   * @param {string} fileName - The name of the file to be uploaded
   * @param {number} fileSize - The size of the file in bytes
   * @param {string} fileType - The MIME type of the file
   * @returns {Promise<any>}
   */
  async getUploadIntent(fileName, fileSize, fileType) {
    throw new Error('Method not implemented.');
  }
}
