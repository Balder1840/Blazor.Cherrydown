namespace Blazor.Cherrydown.Sample
{
    public class StateContainer
    {
        private bool _isSaving { get; set; }

        //public event Action OnSavingChanged = null!;
        public event Action OnSavingChanged = default!;

        public bool IsSaving {
            get {
                return _isSaving;
            }
            set {
                if (_isSaving != value)
                {
                    _isSaving = value;
                    NotifySavingChanged();
                }
            }
        }

        private void NotifySavingChanged() => OnSavingChanged?.Invoke();
    }
}
