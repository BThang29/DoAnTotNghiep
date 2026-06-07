using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Role : ICascadeDelete
    {
        public Role()
        {
            RolePrivileges = new HashSet<RolePrivilege>();
            UserRoles = new HashSet<UserRole>();
        }

        public int Id { get; set; }
        [Required]
        [StringLength(250)]
        public string Name { get; set; }
        [StringLength(4000)]
        public string Description { get; set; }
        [InverseProperty("Role")]
        public virtual ICollection<RolePrivilege> RolePrivileges { get; set; }
        [InverseProperty("Role")]
        public virtual ICollection<UserRole> UserRoles { get; set; }

        public void OnDelete()
        {
            if (UserRoles.Count > 0)
            {
                throw new HotelManagementException(HotelManagementExceptionCode.DeleteRecordWithRelatedData, "nhóm người dùng");
            }

            RolePrivileges.Clear();
        }
    }
}
