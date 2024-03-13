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
        #endregion

        #region Component lifecycles
        public override Task SetParametersAsync(ParameterView parameters)
        {
            return base.SetParametersAsync(parameters);
        }

        protected override void OnInitialized()
        {
            JS ??= new JsInterop(JSRuntime);

            ElementId = $"cherrydown-{Identifier.NewId()}";
            base.OnInitialized();
        }

        protected override Task OnParametersSetAsync()
        {
            return base.OnParametersSetAsync();
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
                    markdown = Markdown
                });

                _initialized = true;
                _markdown = Markdown;
            }
            else if (_initialized)
            {
                if (_markdown != Markdown)
                {
                    _markdown = Markdown;
                    await JS.SetValue(ElementRef, _markdown);
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
