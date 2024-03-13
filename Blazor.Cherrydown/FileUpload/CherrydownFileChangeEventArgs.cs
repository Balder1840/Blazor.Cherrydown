// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

// https://github.com/dotnet/aspnetcore/blob/main/src/Components/Web/src/Forms/InputFile/InputFileChangeEventArgs.cs
namespace Blazor.Cherrydown.FileUpload
{
    /// <summary>
    /// Supplies information about an <see cref="Cherrydown.MarkdownChanged"/> event being raised.
    /// </summary>
    internal sealed class CherrydownFileChangeEventArgs : EventArgs
    {
        private readonly IReadOnlyList<IBrowserFile> _files;

        /// <summary>
        /// Constructs a new <see cref="CherrydownFileChangeEventArgs"/> instance.
        /// </summary>
        /// <param name="files">The list of <see cref="IBrowserFile"/>.</param>
        public CherrydownFileChangeEventArgs(IReadOnlyList<IBrowserFile> files)
        {
            _files = files ?? throw new ArgumentNullException(nameof(files));
        }

        /// <summary>
        /// Gets the number of supplied files.
        /// </summary>
        public int FileCount => _files.Count;

        /// <summary>
        /// Gets the supplied file. Note that if the input accepts multiple files, then instead of
        /// reading this property, you should call <see cref="GetMultipleFiles(int)"/>.
        /// </summary>
        public IBrowserFile File => _files.Count switch
        {
            0 => throw new InvalidOperationException("No file was supplied."),
            1 => _files[0],
            _ => throw new InvalidOperationException($"More than one file was supplied. Call {nameof(GetMultipleFiles)} to receive multiple files."),
        };

        /// <summary>
        /// Gets the file entries list. This method should be used for inputs that accept multiple
        /// files. If the input accepts only a single file, then use the <see cref="File"/> property
        /// instead.
        /// </summary>
        /// <param name="maximumFileCount">The maximum number of files to accept. If the number of files exceeds this value, this method will throw an exception.</param>
        public IReadOnlyList<IBrowserFile> GetMultipleFiles(int maximumFileCount = 10)
        {
            if (_files.Count > maximumFileCount)
            {
                throw new InvalidOperationException($"The maximum number of files accepted is {maximumFileCount}, but {_files.Count} were supplied.");
            }

            return _files;
        }
    }
}
