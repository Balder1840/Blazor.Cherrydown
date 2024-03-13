using Blazor.Cherrydown.FileUpload;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;

namespace Blazor.Cherrydown
{
    public partial class Cherrydown
    {
        //async Task ShowPrompt()
        //{
        //    await JS.ShowPrompt(ElementRef, dotNetObjectRef);
        //}
        //async Task ShowPrompt1()
        //{
        //    await JS.ShowPrompt1(ElementRef, dotNetObjectRef);
        //}

        /// <summary>
        /// Set the markdown value.
        /// </summary>
        /// <param name = "value">Value to set.</param>
        /// <returns>A task that represents the asynchronous operation.</returns>
        public async ValueTask SetValueAsync(string value)
        {
            if (!_initialized)
                return;

            await JS!.SetValue(ElementRef, value);
        }

        /// <summary>
        /// Get the markdown value.
        /// </summary>
        /// <returns>Markdown value.</returns>
        public async ValueTask<string?> GetValueAsync()
        {
            if (!_initialized)
                return null;

            return await JS!.GetValue(ElementRef);
        }

        /// <summary>
        /// Switch the cherry-markdown editor's mode
        /// </summary>
        /// <param name="mode"><see cref="CherrydownMode"/> to set</param>
        /// <returns></returns>
        public async ValueTask SwitchModeAsync(CherrydownMode mode)
        {
            if (_initialized)
            {
                await JS!.SwitchMode(ElementRef, mode);
            }
        }

        /// <summary>
        /// Updates the internal markdown value. This method should only be called internally!
        /// </summary>
        /// <param name="value">New value.</param>
        /// <returns>
        /// A task that represents the asynchronous operation.
        /// </returns>
        [JSInvokable]
        public async Task UpdateInternalValue(string value)
        {
            if (MarkdownChanged.HasDelegate && _markdown != value)
            {
                _markdown = value;
                await MarkdownChanged.InvokeAsync(value);
            }
        }

        [JSInvokable]
        public async Task<FileUploadReturnResultInternal> NotifyFileUpload(BrowserFile file)
        {
            FileUploadReturnResultInternal result = new FileUploadReturnResultInternal(file.Id);
            try
            {
                if (OnFileUpload is not null)
                {
                    file.Owner = this;
                    var uploadResult = await OnFileUpload.Invoke(file);
                    if (uploadResult is null)
                    {
                        result.FileUri = "No file upload result returned!";
                    }
                    else
                    {
                        result.FileUri = uploadResult.FileUri;
                        result.IsUploadSuccess = !string.IsNullOrWhiteSpace(result.FileUri);
                    }
                }
                else
                {
                    result.FileUri = "No file saving handler registered!";
                    _logger.LogError(result.FileUri);
                }

                if (string.IsNullOrWhiteSpace(result.FileUri))
                {
                    result.FileUri = "No accessable FileUri returned!";
                    _logger.LogError(result.FileUri);
                }
            }
            catch (Exception ex)
            {
                result.FileUri = "Error occured when uploading file!";
                _logger.LogError(ex, $"{result.FileUri}: {file.Name}!");
            }

            return result;
        }

        // https://github.com/dotnet/aspnetcore/blob/main/src/Components/Web/src/Forms/InputFile.cs
        internal Stream OpenReadStream(BrowserFile file, long maxAllowedSize, CancellationToken cancellationToken)
            => new BrowserFileStream(
                JS!,
                ElementRef,
                file,
                maxAllowedSize,
                cancellationToken);
    }
}
