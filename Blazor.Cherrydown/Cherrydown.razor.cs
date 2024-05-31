using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Blazor.Cherrydown
{
    public partial class Cherrydown : IAsyncDisposable
    {
        #region Inject and JavaScript

        /// <summary>
        /// The dotnet object reference
        /// </summary>
        private DotNetObjectReference<Cherrydown>? dotNetObjectRef;

        /// <summary>
        /// Gets or sets the <see cref = "JsInterop"/> instance.
        /// </summary>
        protected JsInterop? JS { get; private set; }

        [Inject]
        protected NavigationManager? NavigationManager { get; private set; }

        #endregion Inject and JavaScript

        #region Element references

        /// <summary>
        /// Gets or sets the element identifier.
        /// </summary>
        /// <value>
        /// The element identifier.
        /// </value>
        private string? ElementId { get; set; }

        /// <summary>
        /// Gets or sets the element reference.
        /// </summary>
        /// <value>
        /// The element reference.
        /// </value>
        private ElementReference ElementRef { get; set; }

        #endregion Element references

        #region Fields
        private string? _markdown = null;
        private bool _initialized = false;

        private bool isMarkdownParameterSet = false;
        private bool isMarkdownChangedSet = false;
        #endregion

        #region Component lifecycles
        public override Task SetParametersAsync(ParameterView parameters)
        {
            if (!_initialized)
            {
                var paramsDic = parameters.ToDictionary();
                isMarkdownParameterSet = paramsDic.ContainsKey(nameof(Markdown));
                isMarkdownChangedSet = paramsDic.ContainsKey(nameof(MarkdownChanged));
            }

            return base.SetParametersAsync(parameters);
        }

        //protected override void OnParametersSet()
        //{
        //    base.OnParametersSet();
        //}

        protected override void OnInitialized()
        {
            JS ??= new JsInterop(JSRuntime);

            ElementId = $"cherrydown-{Identifier.NewId()}";
            base.OnInitialized();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                JS ??= new JsInterop(JSRuntime);

                dotNetObjectRef ??= DotNetObjectReference.Create(this);

                var uri = NavigationManager!.Uri;
                var url = uri.Contains("#") ? uri.Remove(uri.IndexOf('#')) : uri;
                await JS.Initialize(dotNetObjectRef, ElementRef, ElementId!, new
                {
                    relativePageUrl = NavigationManager!.ToBaseRelativePath(url),
                    defaultModel = CherrydownMode.EditAndPreview.ToClientMode(),
                    markdown = Markdown,
                    emitValue = isMarkdownChangedSet && isMarkdownParameterSet
                });

                _initialized = true;
                _markdown = Markdown;
            }
            else if (_initialized && isMarkdownParameterSet)
            {
                if (_markdown != Markdown)
                {
                    _markdown = Markdown;
                    await JS!.SetValue(ElementRef, _markdown ?? string.Empty);
                }
            }
            await base.OnAfterRenderAsync(firstRender);
        }

        public async ValueTask DisposeAsync()
        {
            if (JS != null)
            {
                await JS.DisposeAsync(ElementRef);
            }
            dotNetObjectRef?.Dispose();
        }

        #endregion
    }
}
