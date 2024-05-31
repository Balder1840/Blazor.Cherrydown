using Blazor.Cherrydown.Sample;
using Blazor.Cherrydown.Sample.Components;
using Microsoft.Extensions.FileProviders;
using Radzen;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddHubOptions(opt =>
    {
        // https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/signalr?view=aspnetcore-8.0#maximum-receive-message-size
        opt.MaximumReceiveMessageSize = 1024 * 1024; // 1m, default is 32k
    }).AddCircuitOptions(opt =>
    {
        opt.DetailedErrors = true;
    });

builder.Services.AddRadzenComponents();

builder.Services.AddSingleton<StateContainer>();

// do not need, seems nothing happen
// builder.WebHost.UseStaticWebAssets();

var app = builder.Build();

// https://andrewlock.net/using-pathbase-with-dotnet-6-webapplicationbuilder/
// https://learn.microsoft.com/en-us/aspnet/core/blazor/host-and-deploy/?view=aspnetcore-8.0&tabs=visual-studio#app-base-path
// https://github.com/dotnet/aspnetcore/issues/43191#issuecomment-1212156106
// need change <base /> in App.razor as well, otherwise it does't work.
// but above docs do not mention it, if my understanding is correct, it says we may change one of these
app.UsePathBase($"/{app.Configuration.GetValue<string>("AppBasePath")}");

// can work without follwing two line codes
// app.MapBlazorHub($"/{app.Configuration.GetValue<string>("AppBasePath")}");
// accroding to https://andrewlock.net/using-pathbase-with-dotnet-6-webapplicationbuilder/
// we need to add UseRouting here
// app.UseRouting();

// NOT work at all
//app.Map("/CoolApp", subapp =>
//{
//    subapp.UsePathBase("/CoolApp");
//    subapp.UseRouting();
//    subapp.UseEndpoints(endpoints => endpoints.MapBlazorHub());
//});


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

// dot need it when change the base path
// https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/static-files?view=aspnetcore-8.0
// https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files?view=aspnetcore-8.0
// app.UseStaticFiles("/base/path/");

app.UseStaticFiles();

// used for uploading, define a new request path
if (!string.IsNullOrWhiteSpace(app.Configuration.GetValue<string>("WorkDir")))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider($"{app.Configuration.GetValue<string>("WorkDir")}"),
        RequestPath = $"/{app.Configuration.GetValue<string>("WorkDirVirtualPath")}"
    });
}

app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
