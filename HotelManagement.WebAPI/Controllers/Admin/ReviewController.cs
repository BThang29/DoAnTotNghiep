using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Reviews;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
    [Route("api/admin/review")]
    [Authorize]
    public class ReviewController : BaseController
    {
        private readonly ReviewService _reviewService;

        public ReviewController(ReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<PagingResult<ReviewGridDto>>> GetReviews([FromQuery] ReviewGridPagingDto pagingModel)
        {
            return Success(await _reviewService.GetReviews(pagingModel), "Lay danh sach review thanh cong.");
        }

        [HttpGet("{id:int}")]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<ReviewDetailDto>> GetReviewById(int id)
        {
            var review = await _reviewService.GetReviewById(id);
            if (review == null)
            {
                return Failure<ReviewDetailDto>(404, "Khong tim thay review.");
            }

            return Success(review, "Lay chi tiet review thanh cong.");
        }

        [HttpDelete("{id:int}")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<int>> DeleteReview(int id)
        {
            var deletedId = await _reviewService.DeleteReview(id);
            if (!deletedId.HasValue)
            {
                return Failure<int>(404, "Khong tim thay review.");
            }

            return Success(deletedId.Value, "Xoa review thanh cong.");
        }
    }
}
