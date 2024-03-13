using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Blazor.Cherrydown
{
    // This class provides an example of how JavaScript functionality can be wrapped
    // in a .NET class for easy consumption. The associated JavaScript module is
    // loaded on demand when first needed.
    //
    // This class can be registered as scoped DI service and then injected into Blazor
    // components for use.

    public class JsInterop
    {
        private readonly Lazy<Task<IJSObjectReference>> moduleTask;

        public Lazy<Task<IJSObjectReference>> ModuleTask => moduleTask;

        public JsInterop(IJSRuntime jsRuntime)
        {
            moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/Blazor.Cherrydown/cherrydown.js").AsTask());
        }
        //public async Task ShowPrompt(ElementReference elementRef, DotNetObjectReference<Cherrydown> dotNetObjectRef)
        //{
        //    var module = await moduleTask.Value;
        //    await module.InvokeVoidAsync("showPrompt", elementRef, dotNetObjectRef);
        //}

        //public async Task ShowPrompt1(ElementReference elementRef, DotNetObjectReference<Cherrydown> dotNetObjectRef)
        //{
        //    var module = await moduleTask.Value;
        //    await module.InvokeVoidAsync("showPrompt1", elementRef, dotNetObjectRef);
        //}

        /// <summary>
        /// Initialize cherry-markdown editor
        /// </summary>
        /// <param name="dotNetObjectRef">The <see cref="Cherrydown"/> reference</param>
        /// <param name="elementRef">The element reference</param>
        /// <param name="elementId">unique element id</param>
        /// <param name="options">additional options to initialize cherry-markdown editor</param>
        /// <returns></returns>
        public async Task Initialize(DotNetObjectReference<Cherrydown> dotNetObjectRef, ElementReference elementRef, string elementId, object options)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("initialize", dotNetObjectRef, elementRef, elementId, options);
        }

        /// <summary>
        /// Set the value.
        /// </summary>
        /// <param name="elementRef">The element reference</param>
        /// <param name="value">The value.</param>
        /// <returns></returns>
        public async ValueTask SetValue(ElementReference elementRef, string value)
        {
            var module = await moduleTask.Value;

            await module.InvokeVoidAsync("setValue", elementRef, value);
        }

        /// <summary>
        /// Get the value from editor
        /// </summary>
        /// <param name="elementRef">The element reference</param>
        /// <returns>the value get from editor</returns>
        public async ValueTask<string> GetValue(ElementReference elementRef)
        {
            var module = await moduleTask.Value;
            return await module.InvokeAsync<string>("getValue", elementRef);
        }

        /// <summary>
        /// Switch the cherry-markdown editor's mode
        /// </summary>
        /// <param name="elementRef">The element reference</param>
        /// <param name="mode"><see cref="CherrydownMode"/> to set</param>
        /// <returns></returns>
        public async ValueTask SwitchMode(ElementReference elementRef, CherrydownMode mode)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("switchMode", elementRef, mode.ToClientMode());
        }

        /// <summary>
        /// dispose
        /// </summary>
        /// <param name="elementRef">The element reference</param>
        /// <returns></returns>
        public async ValueTask DisposeAsync(ElementReference elementRef)
        {
            if (moduleTask.IsValueCreated)
            {
                var module = await moduleTask.Value;
                await module.InvokeVoidAsync("destroy", elementRef);
                await module.DisposeAsync();
            }
        }
    }
}
