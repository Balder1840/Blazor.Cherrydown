// https://github.com/dotnet/sdk/blob/main/src/StaticWebAssetsSdk/Tasks/ScopedCss/ComputeCssScope.cs#L41
// https://github.com/microsoft/fluentui-blazor/blob/dev/src/Core/Identifier.cs

namespace Blazor.Cherrydown
{
    internal static class Identifier
    {
        private static readonly Random _rnd = new();

        /// <summary>
        /// Returns a new small Id.
        /// HTML id must start with a letter.
        /// Example: f127d9edf14385adb
        /// </summary>
        /// <returns></returns>
        public static string NewId(int length = 8)
        {
            if (length > 16)
            {
                throw new ArgumentOutOfRangeException(nameof(length), "length must be less than 16");
            }

            if (length <= 8)
            {
                return $"{_rnd.Next():x}";
            }

            return $"{_rnd.Next():x}{_rnd.Next():x}"[..length];
        }
    }
}
