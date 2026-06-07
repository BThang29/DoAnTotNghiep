using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebQuanLyKhachSan.API.Commons
{
    public class ApiResult<T>
    {
        public int statusCode { get; set; }

        public string Message { get; set; }

        public T ResultObj { get; set; }
    }
}
