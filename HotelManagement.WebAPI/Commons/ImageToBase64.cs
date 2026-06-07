using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebQuanLyKhachSan.API.Commons
{
    public class ImageToBase64
    {
        public static string toBase64(string fileName)
        {
            //string file = Directory.GetFile("wwwroot/images/" + fileName);
            byte[] imageArray = System.IO.File.ReadAllBytes("wwwroot/images/" + fileName);
            string result = Convert.ToBase64String(imageArray);
            return result;
        }
    }
}
