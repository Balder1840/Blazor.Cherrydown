// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

// https://github.com/dotnet/aspnetcore/blob/main/src/Components/Web/src/Forms/InputFile/BrowserFile.cs
namespace Blazor.Cherrydown.FileUpload
{
    public sealed class BrowserFile : IBrowserFile
    {
        private long _size;

        internal Cherrydown Owner { get; set; } = default!;

        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public DateTimeOffset LastModified { get; set; }

        public long Size {
            get => _size;
            set {
                if (value < 0)
                {
                    throw new ArgumentOutOfRangeException(nameof(Size), $"Size must be a non-negative value. Value provided: {value}.");
                }

                _size = value;
            }
        }

        public string ContentType { get; set; } = string.Empty;

        public string FileExtension =>
            ContentTypeFileExtensionProvider.TryGetFileExtension(ContentType, out var fileExtension) ? fileExtension : string.Empty;

        public string? RelativePath { get; set; }

        public Stream OpenReadStream(long maxAllowedSize = 512000, CancellationToken cancellationToken = default)
        {
            if (Size > maxAllowedSize)
            {
                throw new IOException($"Supplied file with size {Size} bytes exceeds the maximum of {maxAllowedSize} bytes.");
            }

            return Owner.OpenReadStream(this, maxAllowedSize, cancellationToken);
        }
    }
}
