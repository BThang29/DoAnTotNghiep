using DoAnWebQuanLyKhachSan.Utils.Service;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Users
{
    public class UserGridPagingDto : PagingParams<UserGridDto>
    {
        public string? Keyword { get; set; }

        public override List<Expression<Func<UserGridDto, bool>>> GetPredicates()
        {
            if (string.IsNullOrWhiteSpace(Keyword))
            {
                return new List<Expression<Func<UserGridDto, bool>>>();
            }

            return new List<Expression<Func<UserGridDto, bool>>>
            {
                x => x.UserName.Contains(Keyword)
                    || x.FullName.Contains(Keyword)
                    || x.Email.Contains(Keyword)
                    || x.PhoneNumber.Contains(Keyword)
            };
        }
    }
}
