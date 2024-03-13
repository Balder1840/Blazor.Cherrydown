# Blazor.Cherrydown
A blazor markdown editor wraps of [cherry-markdown](https://github.com/Tencent/cherry-markdown) from Tencent.

# Features
- [x] Edit and preview mode.
- [x] Pre-defined toolbar.
- [x] Streaming file uploading(inspired by the built-in `InputFile` component).
- [x] Add auto numbers for TOC.
- [x] Other functionalities that `cherry-markdown` provided.

# Getting started

## Install the package, or download the project and reference it.
```
dotnet add package Blazor.Cherrydown
```

## Add the following using statement in _Imports.razor.
```razor
@using Blazor.Cherrydown
```

> do not need to add the reference to the `javascript` and `CSS`, `Blazor.Cherrydown` will do it for you.
> for more into, you can refer to [blazor initializer](https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/startup?view=aspnetcore-8.0#javascript-initializers)

## Add Cherrydown in a page
```razor
<button @onclick="ChangeMarkdown">Change Markdown</button>
<Cherrydown @bind-Markdown="_markdown" OnFileUpload="@SaveFile" />

@code {
    private string? _markdown = "# CherrydownEditor";

    protected override void OnParametersSet()
    {
        using var reader = new System.IO.StreamReader(@"basic.md");
        _markdown = reader.ReadToEnd();
        base.OnParametersSet();
    }

    void ChangeMarkdown()
    {
        _markdown = "# Changed Markdown";
    }

    private async Task<FileUploadResult> SaveFile(FileUpload.IBrowserFile file)
    {
        var workDir = _config.GetValue<string>("WorkDir");
        var workDirVirtualPath = _config.GetValue<string>("WorkDirVirtualPath");

        await using FileStream fs = new(Path.Combine(workDir, file.Name), FileMode.Create);
        await file.OpenReadStream(15 * 1024 * 1024).CopyToAsync(fs);

        return new FileUploadResult { FileUri = $"{workDirVirtualPath}/{file.Name}" };
    }
}
```