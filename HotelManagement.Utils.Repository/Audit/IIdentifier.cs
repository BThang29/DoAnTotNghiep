namespace DoAnWebQuanLyKhachSan.Utils.Repository.Audit
{
    public interface IIdentifier<TKey>
    {
        TKey Id { get; set; }
    }

    public interface IIdentifier : IIdentifier<int>
    {

    }
}
