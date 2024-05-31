using Blazor.Cherrydown.FileUpload;
using Microsoft.AspNetCore.Components;

namespace Blazor.Cherrydown
{
    public partial class Cherrydown
    {
        /// <summary>
        /// Get or set the markdown value.
        /// </summary>
        [Parameter]
        public string? Markdown { get; set; }

        /// <summary>
        /// An event that occurs after the markdown value has changed.
        /// </summary>
        [Parameter]
        public EventCallback<string> MarkdownChanged { get; set; }

        /// <summary>
        /// An event that occurs when uploading file.
        /// </summary>
        [Parameter]
        public Func<IBrowserFile, Task<FileUploadResult>>? OnFileUpload { get; set; }

        /// <summary>
        /// An event that occurs after the markdown editor init.
        /// </summary>
        [Parameter]
        public EventCallback AfterInit { get; set; }
    }
}
