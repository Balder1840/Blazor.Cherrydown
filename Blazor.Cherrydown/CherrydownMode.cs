namespace Blazor.Cherrydown
{
    public enum CherrydownMode
    {
        EditAndPreview = 0,
        EditOnly,
        PreviewOnly
    }

    public static class CherrydownModeExtension
    {
        private const string EditOnly = "editOnly";
        private const string PreviewOnly = "previewOnly";
        private const string EditAndPreview = "edit&preview";
        public static string ToClientMode(this CherrydownMode mode) => mode switch
        {
            CherrydownMode.EditOnly => EditOnly,
            CherrydownMode.PreviewOnly => PreviewOnly,
            CherrydownMode.EditAndPreview => EditAndPreview,
            _ => EditAndPreview
        };
    }
}
