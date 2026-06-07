using System;
using System.Collections.Generic;
using System.Text;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Common
{
    public class SelectItem
    {
        public string Id { get; set; }
        public string Value { get { return Id; } set { Id = value; } }
        public string Text { get; set; }
    }
}
