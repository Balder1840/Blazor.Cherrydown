namespace Blazor.Cherrydown.FileUpload
{
    public class FileUploadResult
    {
        /// <summary>
        /// An accessable file uri, which is used to display the file in markdown when previewing.
        /// </summary>
        public string FileUri { get; set; } = default!;
    }

    public class FileUploadReturnResultInternal : FileUploadResult
    {
        public int FileId { get; private set; }

        /// <summary>
        /// Indicate if file upload success
        /// </summary>
        public bool IsUploadSuccess { get; set; }

        public FileUploadReturnResultInternal(int fileId)
        {
            FileId = fileId;
        }
    }
}
