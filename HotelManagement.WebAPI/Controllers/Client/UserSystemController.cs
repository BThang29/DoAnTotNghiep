using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Authorize]
    [Route("api/client/usersystem")]
    public class UserSystemController : BaseController
    {
        private AuthorizationService _authorizationService;

        public UserSystemController(AuthorizationService authorizationService)
        {
            _authorizationService = authorizationService;
        }

        [HttpPut("password")]
        public async Task<ApiResult<bool>> ChangePassword(ChangePasswordDto model)
        {
            ApiResult<bool> result = new ApiResult<bool>();
            if (!ModelState.IsValid)
            {
                result.ResultObj = false;
                result.Message = "Đã có lỗi xẩy ra với hệ thống, vui lòng thử lại !";
                result.statusCode = 400;
                return result;
            }

            var check = await _authorizationService.ChangePassword(UserIdentity.Username, model);
            if (check)
            {
                result.ResultObj = check;
                result.Message = "Đổi mật khẩu thành công !";
                result.statusCode = 201;
                return result;
            }
            else
            {
                result.ResultObj = check;
                result.Message = "Đã có lỗi xẩy ra với hệ thống, vui lòng thử lại !";
                result.statusCode = 500;
                return result;
            }
        }
    }
}
