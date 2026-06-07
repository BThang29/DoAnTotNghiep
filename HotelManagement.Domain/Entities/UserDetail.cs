using System;
using System.Collections.Generic;
using System.Text;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class UserDetail
    {
        public int id { get; set; }
        public string name{ get; set; }
        public string phone { get; set; }
        public int userId { get; set; }
        public string address { get; set; }
        public string addressStore { get; set; }
        public string code { get; set; }
        public DateTime createdDate { get; set; }
        public DateTime modifiedDate { get; set; }
    }
}
