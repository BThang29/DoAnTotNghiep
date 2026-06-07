using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using Microsoft.AspNetCore.Mvc;
namespace DoAnWebQuanLyKhachSan.API.Helpers
{
    [ApiController]
    public class BaseController : Controller
    {
        private Lazier<IUserIdentity<int>> _userIdentity;
        protected IUserIdentity<int> UserIdentity
        {
            get
            {
                if (_userIdentity == null) _userIdentity = new Lazier<IUserIdentity<int>>(HttpContext.RequestServices);

                return _userIdentity.Value;
            }
        }

        public BaseController()
        {
        }

        protected static ApiResult<T> Success<T>(T data, string message, int statusCode = 200)
        {
            return new ApiResult<T>
            {
                ResultObj = data,
                Message = message,
                statusCode = statusCode
            };
        }

        protected static ApiResult<T> Failure<T>(int statusCode, string message)
        {
            return new ApiResult<T>
            {
                ResultObj = default!,
                Message = message,
                statusCode = statusCode
            };
        }
    }
}
