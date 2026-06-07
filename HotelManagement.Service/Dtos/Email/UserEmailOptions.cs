using System;
using System.Collections.Generic;
using System.Text;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Email
{
    public class UserEmailOptions
    {
        public string ToEmails { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public List<KeyValuePair<string, string>> PlaceHolders { get; set; }
    }
}
