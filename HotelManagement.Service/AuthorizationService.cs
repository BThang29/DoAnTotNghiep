using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Authorization;
using DoAnWebQuanLyKhachSan.Service.Helpers;
using DoAnWebQuanLyKhachSan.Utils.Common;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Linq.Dynamic.Core;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class AuthorizationService
	{
		private const string CustomerRoleName = "Customer";
		private const string CustomerRoleDescription = "Customer";
		private const string AdministratorRoleName = "Administrator";
		private const string NormalCustomerTypeName = "Thuong";
		private const string DefaultAvatar = "user.png";
		private BaseService _baseService;
		private IMapper _mapper;
		private HotelManagementRepository _repository;
		private UserManager<User> _userManager;
		private IUserIdentity<int> _userIdentity;

		public AuthorizationService(HotelManagementRepository repository, IMapper mapper, UserManager<User> userManager, IUserIdentity<int> userIdentity)
		{
			_repository = repository;
			_mapper = mapper;
			_userManager = userManager;
			_userIdentity = userIdentity;
			_baseService = new BaseService(repository, mapper);
		}


		public async Task<List<string>> GetUserPrivileges(int userId)
		{
			return await _repository.Filter<UserPrivilege>(x => x.UserId == userId).Select(x => x.PrivilegeId).ToListAsync();
		}

		public async Task<int> GetUserByPrivilegeId(string PrivilegeId)
		{
			return await _repository.Filter<UserPrivilege>(x => x.PrivilegeId == PrivilegeId && x.UserId == _userIdentity.UserId).Select(x => x.UserId).SingleOrDefaultAsync();
		}

		public async Task<List<string>> GetRolePrivileges(int roleId)
		{
			return await _repository.Filter<RolePrivilege>(x => x.RoleId == roleId).Select(x => x.PrivilegeId).ToListAsync();
		}

		public async Task<int> GetRoleByPrivilegeId(string PrivilegeId)
		{
			return await _repository.Filter<RolePrivilege>(x => x.PrivilegeId == PrivilegeId).Select(x => x.RoleId).SingleOrDefaultAsync();
		}

		public async Task SaveUserPrivileges(int userId, string[] privileges)
		{
			using (var ts = _repository.BeginTransaction())
			{
				var db = _repository.GetDbContext<HotelManagementContext>();
				var userPrivileges = await db.UserPrivileges.Include(x => x.Privilege).Where(x => x.UserId == userId).ToListAsync();

				foreach (var removingPrivilges in userPrivileges.Where(x => !privileges.Contains(x.PrivilegeId)))
				{
					db.Remove(removingPrivilges);
				}

				foreach (var newPrivilege in privileges.Where(x => !userPrivileges.Any(y => y.PrivilegeId == x)))
				{
					db.Add(new UserPrivilege() { UserId = userId, PrivilegeId = newPrivilege });
				}

				await db.SaveChangesAsync();

				ts.Commit();
			}
		}

		public async Task DeleteUserPrivileges(int userId, string[] privileges)
		{
			using (var ts = _repository.BeginTransaction())
			{
				var db = _repository.GetDbContext<HotelManagementContext>();
				var userPrivileges = await db.UserPrivileges.Include(x => x.Privilege).Where(x => x.UserId == userId).ToListAsync();

				foreach (var removingPrivilges in userPrivileges.Where(x => privileges.Contains(x.PrivilegeId)))
				{
					db.Remove(removingPrivilges);
				}

				await db.SaveChangesAsync();

				ts.Commit();
			}
		}

		public async Task SaveRolePrivileges(int roleId, string[] privileges)
		{
			using (var ts = _repository.BeginTransaction())
			{
				var db = _repository.GetDbContext<HotelManagementContext>();
				var rolePrivileges = await db.RolePrivileges.Include(x => x.Privilege).Where(x => x.RoleId == roleId).ToListAsync();
				var a = rolePrivileges.Where(x => !privileges.Contains(x.PrivilegeId));
				foreach (var removingPrivilges in a)
				{
					db.Remove(removingPrivilges);
				}

				var b = privileges.Where(x => !rolePrivileges.Any(y => y.PrivilegeId == x));
				foreach (var newPrivilege in b)
				{
					db.Add(new RolePrivilege() { RoleId = roleId, PrivilegeId = newPrivilege });
				}

				await db.SaveChangesAsync();

				ts.Commit();
			}
		}

		public async Task DeleteRolePrivilege(int roleId, string[] privileges)
		{
			using (var ts = _repository.BeginTransaction())
			{
				var db = _repository.GetDbContext<HotelManagementContext>();
				var rolePrivileges = await db.RolePrivileges.Include(x => x.Privilege).Where(x => x.RoleId == roleId).ToListAsync();

				foreach (var removingPrivilges in rolePrivileges.Where(x => privileges.Contains(x.PrivilegeId)))
				{
					db.Remove(removingPrivilges);
				}

				await db.SaveChangesAsync();

				ts.Commit();
			}
		}

		public async Task SaveUserRoles(int userId, List<int> roles = null)
		{
			if (roles == null) roles = new List<int>();

			var db = _repository.GetDbContext<HotelManagementContext>();
			var userRoles = await db.UserRoles.Include(x => x.Role).Where(x => x.UserId == userId).ToListAsync();

			foreach (var removingRole in userRoles.Where(x => !roles.Contains(x.RoleId)))
			{
				db.Remove(removingRole);
			}

			foreach (var newRole in roles.Where(x => !userRoles.Any(y => y.RoleId == x)))
			{
				db.Add(new UserRole() { UserId = userId, RoleId = newRole });
			}

			await db.SaveChangesAsync();
		}

		public async Task DeleteUserRoles(int userId, List<int> roles = null)
		{
			if (roles == null) roles = new List<int>();

			var db = _repository.GetDbContext<HotelManagementContext>();
			var userRoles = await db.UserRoles.Include(x => x.Role).Where(x => x.UserId == userId).ToListAsync();
			var role = userRoles.Where(x => roles.Contains(x.RoleId)).ToList();

			foreach (var removingRole in userRoles.Where(x => roles.Contains(x.RoleId)))
			{
				db.Remove(removingRole);
			}

			await db.SaveChangesAsync();
		}

		public async Task<bool> ChangePassword(string userName, ChangePasswordDto model)
		{
			var user = await _userManager.FindByNameAsync(userName);
			var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);

			if (result.Succeeded)
			{
				return true;
			}
			else
			{
				throw new Exception(string.Format(". \n\r", result.Errors.Select(x => x.Description)));
			}
		}

		public async Task<User> FindUserByEmail(string email)
		{
			return await _userManager.FindByEmailAsync(email);
		}

		public async Task<string[]> forgotPassword(string username, ForgotPasswordDto model)
		{
			var user = await _userManager.FindByEmailAsync(model.Email);
			string[] resultInt = new string[2];
			if (user != null)
			{
				var token = await _userManager.GeneratePasswordResetTokenAsync(user);

				model.newPassword = randomPassString();
				user.PasswordVerificationToken = randomTokenString();
				user.DateValidateToken = DateTime.Now;
				await _userManager.UpdateAsync(user);
				var result = await _userManager.ResetPasswordAsync(user, token, model.newPassword);

				if (!result.Succeeded)
				{
					var errors = string.Join(".", result.Errors.Select(x => x.Description));
					resultInt[0] = "0";
					resultInt[1] = string.IsNullOrWhiteSpace(errors) ? "Khong the dat lai mat khau." : errors;
					return resultInt;
				}

				resultInt[0] = "1";
				resultInt[1] = model.newPassword;
				return resultInt;
			}
			else
			{
				resultInt[0] = "0";
				resultInt[1] = "Sai email hoặc email không tồn tại trong hệ thống !";
				return resultInt;
			}
		}

		private string randomTokenString()
		{
			var rngCryptoServiceProvider = new RNGCryptoServiceProvider();
			var randomBytes = new byte[40];
			rngCryptoServiceProvider.GetBytes(randomBytes);
			// convert random bytes to hex string
			return BitConverter.ToString(randomBytes).Replace("-", "");
		}

		private string randomPassString()
		{
			const string allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
			var passwordChars = new char[6];
			var randomBytes = new byte[passwordChars.Length];
			using var rngCryptoServiceProvider = new RNGCryptoServiceProvider();
			rngCryptoServiceProvider.GetBytes(randomBytes);

			for (var i = 0; i < passwordChars.Length; i++)
			{
				passwordChars[i] = allowedChars[randomBytes[i] % allowedChars.Length];
			}

			return new string(passwordChars);
		}

		public async Task<bool> HasAdministratorRoleAsync(IEnumerable<int>? roleIds)
		{
			var normalizedRoleIds = roleIds?.Distinct().ToList() ?? new List<int>();
			if (normalizedRoleIds.Count == 0)
			{
				return false;
			}

			var db = _repository.GetDbContext<HotelManagementContext>();
			return await db.Roles
				.AsNoTracking()
				.AnyAsync(x => normalizedRoleIds.Contains(x.Id) && x.Name == AdministratorRoleName);
		}

		public async Task<string?> GetDeletedRegistrationConflictMessageAsync(string? userName, string? email, string? phoneNumber)
		{
			var normalizedUserName = Normalize(userName);
			var normalizedEmail = Normalize(email);
			var normalizedPhoneNumber = Normalize(phoneNumber);

			if (string.IsNullOrWhiteSpace(normalizedUserName) &&
				string.IsNullOrWhiteSpace(normalizedEmail) &&
				string.IsNullOrWhiteSpace(normalizedPhoneNumber))
			{
				return null;
			}

			var normalizedLookupUserName = normalizedUserName?.ToUpperInvariant();
			var normalizedLookupEmail = normalizedEmail?.ToUpperInvariant();
			var db = GetDbContext();

			var deletedUser = await db.Users
				.AsNoTracking()
				.Where(x => x.DeletedDate != null || x.DeletedUserId != null)
				.FirstOrDefaultAsync(x =>
					(!string.IsNullOrWhiteSpace(normalizedLookupUserName) && x.NormalizedUserName == normalizedLookupUserName) ||
					(!string.IsNullOrWhiteSpace(normalizedLookupEmail) && x.NormalizedEmail == normalizedLookupEmail) ||
					(!string.IsNullOrWhiteSpace(normalizedPhoneNumber) && x.PhoneNumber == normalizedPhoneNumber));

			if (deletedUser == null)
			{
				return null;
			}

			if (!string.IsNullOrWhiteSpace(normalizedLookupUserName) && deletedUser.NormalizedUserName == normalizedLookupUserName)
			{
				return "Tên đăng nhập đã tồn tại trong tài khoản đã bị xóa. Vui lòng dùng tên đăng nhập khác hoặc liên hệ quản trị viên.";
			}

			if (!string.IsNullOrWhiteSpace(normalizedLookupEmail) && deletedUser.NormalizedEmail == normalizedLookupEmail)
			{
				return "Email đã tồn tại trong tài khoản đã bị xóa. Vui lòng dùng email khác hoặc liên hệ quản trị viên.";
			}

			return "Số điện thoại đã tồn tại trong tài khoản đã bị xóa. Vui lòng dùng số điện thoại khác hoặc liên hệ quản trị viên.";
		}

		public async Task<AuthActionResultDto> LoginAsync(
			string grantType,
			string clientId,
			string clientSecret,
			string? username,
			string? password,
			string? refreshToken,
			string secret,
			string issuer,
			string audience)
		{
			var client = await GetDbContext().IdentityClients
				.AsNoTracking()
				.SingleOrDefaultAsync(x => x.IdentityClientId == clientId && x.SecretKey == clientSecret);

			if (client == null)
			{
				return new AuthActionResultDto
				{
					StatusCode = 400,
					Message = "Unauthorized client.",
					ResultObj = "Unauthorized client."
				};
			}

			return grantType switch
			{
				"password" => await DoPasswordLoginAsync(clientId, password, username, client, secret, issuer, audience),
				"refresh_token" => await DoRefreshTokenAsync(clientId, refreshToken, client, secret, issuer, audience),
				"invalidate_token" => await DoInvalidateTokenAsync(refreshToken),
				_ => new AuthActionResultDto
				{
					StatusCode = 400,
					Message = "Invalid grant type.",
					ResultObj = "Invalid grant type."
				}
			};
		}

		#region Role
		public async Task<int> CreateRole(RoleCreateDto roleCreate, bool isExploiting = false)
		{
			var db = _repository.GetDbContext<HotelManagementContext>();
			if (await db.Roles.AnyAsync(x => x.Name == roleCreate.Name))
			{
				return -1;
			}

			await _baseService.CreateAsync<Role, RoleCreateDto>(roleCreate);
			return roleCreate.Id;
		}

		public async Task<PagingResult<RoleGridDto>> GetRoles(RoleGridPagingDto pagingModel)
		{
			return await _baseService.FilterPagedAsync<Role, RoleGridDto>(pagingModel);
		}

		public async Task<int> DeleteRole(int id)
		{
			return await _baseService.DeleteAsync<Role, int>(id);
		}

		public async Task<int> DeleteRole(int[] ids)
		{
			return await _baseService.DeleteAsync<Role, int>(ids);
		}

		public async Task<RoleDetailDto> GetRoleById(int id)
		{
			return await _baseService.FindAsync<Role, RoleDetailDto>(id);
		}

		public async Task<int> UpdateRole(int id, RoleUpdateDto editedRole)
		{
			return await _baseService.UpdateAsync<Role, RoleUpdateDto>(id, editedRole);
		}
		#endregion

		#region User
		public async Task<int> CreateUser(UserCreateDto newUser)
		{
			using (var ts = _repository.BeginTransaction())
			{
				var entityUser = _mapper.Map<User>(newUser);
				entityUser.Active = newUser.Active <= 0 ? 0 : 1;

				var result = await _userManager.CreateAsync(entityUser, newUser.Password);

				if (!result.Succeeded)
				{
					var errors = string.Join(".", result.Errors.Select(x => x.Description));

					throw new HotelManagementException(errors);
				}
				else
				{
					await SaveUserRoles(entityUser.Id, newUser.RoleIds);

					if (await HasCustomerRegistrationRoleAsync(newUser.RoleIds))
					{
						await EnsureCustomerRecordAsync(entityUser.Id, entityUser.FullName, entityUser.Email, entityUser.PhoneNumber);
						await GetDbContext().SaveChangesAsync();
					}
				}

				ts.Commit();
				return entityUser.Id;
			}
		}

		public async Task<PagingResult<UserGridDto>> GetUsers(UserGridPagingDto pagingModel)
		{
			return await _baseService.FilterPagedAsync<User, UserGridDto>(pagingModel);
		}

		public async Task<PagingResult<UserGridDto>> GetManagementUsers(UserGridPagingDto pagingModel)
		{
			pagingModel ??= new UserGridPagingDto();
			var db = GetDbContext();
			var query = db.Users
				.AsNoTracking()
				.Include(x => x.UserRoles)
				.ThenInclude(x => x.Role)
				.Where(x => x.DeletedDate == null && !x.UserRoles.Any(y => y.Role.Name == CustomerRoleName));

			if (!string.IsNullOrWhiteSpace(pagingModel.Keyword))
			{
				var keyword = pagingModel.Keyword.Trim();
				query = query.Where(x =>
					(x.UserName ?? string.Empty).Contains(keyword) ||
					(x.FullName ?? string.Empty).Contains(keyword) ||
					(x.Email ?? string.Empty).Contains(keyword) ||
					(x.PhoneNumber ?? string.Empty).Contains(keyword));
			}

			if (!string.IsNullOrWhiteSpace(pagingModel.SortExpression))
			{
				query = query.OrderBy(pagingModel.SortExpression);
			}
			else
			{
				query = query.OrderBy(x => x.Active).ThenByDescending(x => x.CreateDate).ThenByDescending(x => x.Id);
			}

			var totalRows = await query.CountAsync();
			var startingIndex = pagingModel.StartingIndex > 0
				? pagingModel.StartingIndex
				: Math.Max(0, (pagingModel.Page - 1) * pagingModel.ItemsPerPage);

			if (startingIndex > 0)
			{
				query = query.Skip(startingIndex);
			}

			var pageSize = pagingModel.ItemsPerPage <= 0 || pagingModel.ItemsPerPage == -1
				? 100
				: pagingModel.ItemsPerPage;

			query = query.Take(pageSize);

			var data = await query
				.Select(x => new UserGridDto
				{
					Id = x.Id,
					UserName = x.UserName ?? string.Empty,
					FullName = x.FullName ?? string.Empty,
					Email = x.Email ?? string.Empty,
					PhoneNumber = x.PhoneNumber ?? string.Empty,
					Address = x.Address ?? string.Empty,
					Active = x.Active,
					IsAdministrator = x.IsAdministrator,
					DeletedUserId = x.DeletedUserId,
					CreateDate = x.CreateDate.HasValue ? x.CreateDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : string.Empty,
					backgroundImage = x.backgroundImage ?? string.Empty,
					Roles = x.UserRoles.Select(y => y.Role.Name).Where(y => !string.IsNullOrWhiteSpace(y)).Distinct().ToArray()
				})
				.ToListAsync();

			return new PagingResult<UserGridDto>
			{
				PageSize = pageSize,
				CurrentPage = pagingModel.Page,
				TotalRows = totalRows,
				Data = data
			};
		}

		public async Task<bool> ActivateUser(int id)
		{
			var user = await GetDbContext().Users.FirstOrDefaultAsync(x => x.Id == id && x.DeletedDate == null);
			if (user == null)
			{
				return false;
			}

			if (user.Active == 1)
			{
				return true;
			}

			user.Active = 1;
			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<int> DeleteUser(int id)
		{
			var user = await _baseService.FindAsync<User, UserDetailDto>(id);

			await DeleteUserRoles(id, user.RoleIds);
			return await _baseService.DeleteAsync<User, int>(id);
		}

		public async Task<int> DeleteUser(int[] ids)
		{
			return await _baseService.DeleteAsync<User, int>(ids);
		}

		public async Task<UserDetailDto> GetUserById(int id)
		{
			return await _baseService.FindAsync<User, UserDetailDto>(id);
		}

		public async Task<bool> UpdateUser(int id, UserUpdateDto editedUser, List<int> roleIds)
		{
			using (var ts = _repository.BeginTransaction())
			{
				await _baseService.UpdateAsync<User, UserUpdateDto>(id, editedUser);
				//List<int> roleIds = editedUser.RoleIds.ToList();
				await SaveUserRoles(id, roleIds);
				if (!string.IsNullOrEmpty(editedUser.NewPassword))
				{
					var user = await _baseService.GetDbContext<HotelManagementContext>().Users.FindAsync(id);
					var token = await _userManager.GeneratePasswordResetTokenAsync(user);

					var result = await _userManager.ResetPasswordAsync(user, token, editedUser.NewPassword);

					if (!result.Succeeded)
					{
						throw new HotelManagementException(string.Join(".", result.Errors.Select(x => x.Description)));
					}
				}

				ts.Commit();
				return true;
			}
		}
		#endregion

		public async Task<int> UpdateImage(int id, ImageUpdateDto editedUser)
		{
			return await _baseService.UpdateAsync<User, ImageUpdateDto>(id, editedUser);
		}

		public async Task<PagingResult<UserGridDto>> GetEmployees(UserGridPagingDto pagingModel)
		{
			return await GetManagementUsers(pagingModel);
		}

		public async Task<UserDetailDto?> GetEmployeeById(int id)
		{
			var employee = await GetEmployeeQuery().FirstOrDefaultAsync(x => x.Id == id);
			return employee == null ? null : _mapper.Map<UserDetailDto>(employee);
		}

		public async Task<(bool IsValid, bool IsAdministrator, List<int> RoleIds)> ResolveEmployeeRolesAsync(IEnumerable<int> roleIds)
		{
			roleIds ??= Enumerable.Empty<int>();
			var requestedRoleIds = roleIds.Distinct().ToList();
			if (!requestedRoleIds.Any())
			{
				return (false, false, new List<int>());
			}

			var db = _repository.GetDbContext<HotelManagementContext>();
			var resolvedRoleIds = await db.Roles
				.AsNoTracking()
				.Where(x => requestedRoleIds.Contains(x.Id) && x.Name != CustomerRoleName)
				.Select(x => x.Id)
				.Distinct()
				.ToListAsync();

			if (resolvedRoleIds.Count != requestedRoleIds.Count)
			{
				return (false, false, resolvedRoleIds);
			}

			var isAdministrator = await db.Roles
				.AsNoTracking()
				.AnyAsync(x => resolvedRoleIds.Contains(x.Id) && x.Name == AdministratorRoleName);

			return (true, isAdministrator, resolvedRoleIds);
		}

		public async Task<bool> EmployeeExists(int id)
		{
			return await GetEmployeeQuery().AnyAsync(x => x.Id == id);
		}

		public async Task<bool> EmployeesExist(int[] ids)
		{
			var normalizedIds = ids?.Distinct().ToArray() ?? Array.Empty<int>();
			if (normalizedIds.Length == 0)
			{
				return false;
			}

			var existingIds = await GetEmployeeQuery()
				.Where(x => normalizedIds.Contains(x.Id))
				.Select(x => x.Id)
				.ToListAsync();

			return existingIds.Count == normalizedIds.Length;
		}

		public async Task<int> CreateEmployee(UserCreateDto newEmployee)
		{
			var roleResolution = await ResolveEmployeeRolesAsync(newEmployee.RoleIds ?? new List<int>());
			if (!(newEmployee.RoleIds ?? new List<int>()).Any())
			{
				return -2;
			}

			if (!roleResolution.IsValid)
			{
				return -3;
			}

			newEmployee.RoleIds = roleResolution.RoleIds;
			newEmployee.IsAdministrator = roleResolution.IsAdministrator;
			newEmployee.Active = 0;
			newEmployee.backgroundImage = string.IsNullOrWhiteSpace(newEmployee.backgroundImage) ? DefaultAvatar : newEmployee.backgroundImage;

			return await CreateUser(newEmployee);
		}

		public async Task<int> UpdateEmployee(int id, UserUpdateDto editedEmployee)
		{
			var employee = await GetEmployeeById(id);
			if (employee == null)
			{
				return -1;
			}

			var roleResolution = await ResolveEmployeeRolesAsync(editedEmployee.RoleIds ?? new List<int>());
			if (!(editedEmployee.RoleIds ?? new List<int>()).Any())
			{
				return -2;
			}

			if (!roleResolution.IsValid)
			{
				return -3;
			}

			editedEmployee.RoleIds = roleResolution.RoleIds;
			editedEmployee.IsAdministrator = roleResolution.IsAdministrator;
			editedEmployee.backgroundImage = string.IsNullOrWhiteSpace(editedEmployee.backgroundImage) ? employee.backgroundImage : editedEmployee.backgroundImage;

			await UpdateUser(id, editedEmployee, roleResolution.RoleIds);
			return 1;
		}

		public async Task<int> UpdateEmployeeImage(int id, ImageUpdateDto model)
		{
			if (!await EmployeeExists(id))
			{
				return -1;
			}

			if (string.IsNullOrWhiteSpace(model.backgroundImage))
			{
				return -2;
			}

			await UpdateImage(id, model);
			return 1;
		}

		public async Task<int> DeleteEmployee(int id, int currentUserId)
		{
			if (id == currentUserId)
			{
				return -2;
			}

			if (!await EmployeeExists(id))
			{
				return -1;
			}

			await DeleteUser(id);
			return 1;
		}

		public async Task<int> DeleteEmployees(int[] ids, int currentUserId)
		{
			if (ids == null || ids.Length == 0)
			{
				return -2;
			}

			var normalizedIds = ids.Distinct().ToArray();
			if (normalizedIds.Contains(currentUserId))
			{
				return -3;
			}

			if (!await EmployeesExist(normalizedIds))
			{
				return -1;
			}

			foreach (var id in normalizedIds)
			{
				await DeleteUser(id);
			}

			return normalizedIds.Length;
		}

		private IQueryable<User> GetEmployeeQuery()
		{
			var db = _repository.GetDbContext<HotelManagementContext>();

			return db.Users
				.AsNoTracking()
				.Include(x => x.UserRoles)
				.ThenInclude(x => x.Role)
				.Where(x => x.DeletedDate == null && !x.UserRoles.Any(y => y.Role.Name == CustomerRoleName));
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}

		private async Task<AuthActionResultDto> DoInvalidateTokenAsync(string? refreshToken)
		{
			var token = await GetDbContext().IdentityRefreshTokens.FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

			if (token == null)
			{
				return new AuthActionResultDto
				{
					StatusCode = 200,
					Message = string.Empty,
					ResultObj = string.Empty
				};
			}

			GetDbContext().Remove(token);
			await GetDbContext().SaveChangesAsync();

			return new AuthActionResultDto
			{
				StatusCode = 200,
				Message = string.Empty,
				ResultObj = string.Empty
			};
		}

		private async Task<AuthActionResultDto> DoPasswordLoginAsync(
			string clientId,
			string? password,
			string? username,
			IdentityClient client,
			string secret,
			string issuer,
			string audience)
		{
			var user = await GetUserForAuthenticationAsync(username);

			if (user == null)
			{
				return InvalidUserInformationResult();
			}

			var passwordHasher = new PasswordHasher<User>();
			var passwordVerificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash!, password ?? string.Empty);

			if (passwordVerificationResult == PasswordVerificationResult.Failed)
			{
				return InvalidUserInformationResult();
			}

			if (user.Active != 1)
			{
				return new AuthActionResultDto
				{
					StatusCode = 403,
					Message = "Tai khoan phai cho quan tri vien duyet.",
					ResultObj = "Tai khoan phai cho quan tri vien duyet."
				};
			}

			var newRefreshToken = Guid.NewGuid().ToString().Replace("-", "");
			GetDbContext().IdentityRefreshTokens.Add(new IdentityRefreshToken
			{
				ClientId = clientId,
				RefreshToken = newRefreshToken,
				IdentityRefreshTokenId = Guid.NewGuid().ToString(),
				IssuedUtc = DateTime.UtcNow,
				ExpiresUtc = DateTime.UtcNow.AddDays(client.RefreshTokenLifetime),
				Identity = username!
			});

			await GetDbContext().SaveChangesAsync();

			return new AuthActionResultDto
			{
				StatusCode = 200,
				Message = string.Empty,
				ResultObj = await BuildJwtResponseAsync(clientId, newRefreshToken, user, secret, issuer, audience)
			};
		}

		private async Task<AuthActionResultDto> DoRefreshTokenAsync(
			string clientId,
			string? refreshToken,
			IdentityClient client,
			string secret,
			string issuer,
			string audience)
		{
			var token = await GetDbContext().IdentityRefreshTokens.FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

			if (token == null)
			{
				return new AuthActionResultDto
				{
					StatusCode = 400,
					Message = "Token not found.",
					ResultObj = "Token not found."
				};
			}

			if (token.IsExpired)
			{
				GetDbContext().IdentityRefreshTokens.Remove(token);
				await GetDbContext().SaveChangesAsync();

				return new AuthActionResultDto
				{
					StatusCode = 400,
					Message = "Token has expired.",
					ResultObj = "Token has expired."
				};
			}

			var newRefreshToken = Guid.NewGuid().ToString().Replace("-", "");
			GetDbContext().IdentityRefreshTokens.Remove(token);
			GetDbContext().IdentityRefreshTokens.Add(new IdentityRefreshToken
			{
				ClientId = clientId,
				RefreshToken = newRefreshToken,
				IdentityRefreshTokenId = Guid.NewGuid().ToString(),
				IssuedUtc = DateTime.Now,
				ExpiresUtc = DateTime.Now.AddDays(client.RefreshTokenLifetime),
				Identity = token.Identity
			});

			await GetDbContext().SaveChangesAsync();

			var user = await GetUserForAuthenticationAsync(token.Identity);
			if (user == null)
			{
				return new AuthActionResultDto
				{
					StatusCode = 400,
					Message = "User not found.",
					ResultObj = "User not found."
				};
			}

			return new AuthActionResultDto
			{
				StatusCode = 200,
				Message = string.Empty,
				ResultObj = await BuildJwtResponseAsync(clientId, newRefreshToken, user, secret, issuer, audience)
			};
		}

		private async Task<User?> GetUserForAuthenticationAsync(string? username)
		{
			return await GetDbContext().Users
				.Include(x => x.UserPrivileges)
				.Include(x => x.UserRoles)
				.ThenInclude(x => x.Role)
				.ThenInclude(x => x.RolePrivileges)
				.FirstOrDefaultAsync(x => x.UserName == username && x.DeletedDate == null);
		}

		private static AuthActionResultDto InvalidUserInformationResult()
		{
			return new AuthActionResultDto
			{
				StatusCode = 400,
				Message = "Invalid user infomation.",
				ResultObj = "Invalid user infomation."
			};
		}

		private async Task<bool> HasCustomerRegistrationRoleAsync(IEnumerable<int>? roleIds)
		{
			var normalizedRoleIds = roleIds?.Distinct().ToList() ?? new List<int>();
			if (!normalizedRoleIds.Any())
			{
				return false;
			}

			var isExisting = await GetDbContext().Roles.AnyAsync(x =>
				normalizedRoleIds.Contains(x.Id) &&
				x.Name == CustomerRoleDescription);

			return isExisting;
		}

		private async Task EnsureCustomerRecordAsync(int userId, string? fullName, string? email, string? phoneNumber)
		{
			var db = GetDbContext();
			var normalizedEmail = Normalize(email);
			var normalizedPhone = Normalize(phoneNumber);

			var customer = await db.Customers.FirstOrDefaultAsync(x =>
				x.userid == userId ||
				(!string.IsNullOrWhiteSpace(normalizedEmail) && x.mail == normalizedEmail) ||
				(!string.IsNullOrWhiteSpace(normalizedPhone) && x.phone == normalizedPhone));

			if (customer != null)
			{
				customer.userid = userId;
				if (!string.IsNullOrWhiteSpace(fullName))
				{
					customer.fullname = fullName.Trim();
				}

				if (!string.IsNullOrWhiteSpace(normalizedEmail))
				{
					customer.mail = normalizedEmail;
				}

				if (!string.IsNullOrWhiteSpace(normalizedPhone))
				{
					customer.phone = normalizedPhone;
				}
				return;
			}

			var customerTypeId = await EnsureAndResolveNormalCustomerTypeIdAsync();

			db.Customers.Add(new Customer
			{
				userid = userId,
				fullname = string.IsNullOrWhiteSpace(fullName) ? await BuildDefaultCustomerNameAsync() : fullName.Trim(),
				phone = normalizedPhone,
				mail = normalizedEmail,
				dob = DateTime.Today,
				customer_type = customerTypeId
			});
		}

		private async Task<int?> EnsureAndResolveNormalCustomerTypeIdAsync()
		{
			var db = GetDbContext();
			var customerTypeId = await db.CustomerTypes
				.AsNoTracking()
				.Where(x => x.summary == NormalCustomerTypeName)
				.Select(x => (int?)x.id)
				.FirstOrDefaultAsync();

			if (customerTypeId.HasValue)
			{
				return customerTypeId;
			}

			var customerType = new CustomerType
			{
				summary = NormalCustomerTypeName
			};

			db.CustomerTypes.Add(customerType);
			await db.SaveChangesAsync();
			return customerType.id;
		}

		private static string? Normalize(string? value)
		{
			return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
		}

		private async Task<string> BuildDefaultCustomerNameAsync()
		{
			var lastCustomerId = await GetDbContext().Customers
				.AsNoTracking()
				.OrderByDescending(x => x.id)
				.Select(x => (int?)x.id)
				.FirstOrDefaultAsync();

			var nextCustomerId = (lastCustomerId ?? 0) + 1;
			return $"customer_{nextCustomerId}";
		}

		private async Task<AuthTokenResponseDto> BuildJwtResponseAsync(
			string clientId,
			string refreshToken,
			User user,
			string secret,
			string issuer,
			string audience)
		{
			var privileges = user.UserPrivileges.Select(x => x.PrivilegeId)
				.Union(user.UserRoles.SelectMany(x => x.Role.RolePrivileges.Select(y => y.PrivilegeId)))
				.Distinct()
				.ToList();

			var claims = new Claim[]
			{
				new Claim("client_id", clientId),
				new Claim("user_id", user.Id.ToString()),
				new Claim(ClaimTypes.GivenName, user.FullName, ClaimValueTypes.String),
				new Claim(ClaimTypes.NameIdentifier, user.UserName, ClaimValueTypes.String),
				new Claim("is_administrator", user.IsAdministrator.ToString()),
				new Claim("privileges", string.Join(",", privileges)),
			};

			var keyByteArray = Encoding.ASCII.GetBytes(secret);
			var signingKey = new SymmetricSecurityKey(keyByteArray);
			var expires = DateTime.Now.AddMinutes(60);
			var jwt = new JwtSecurityToken(
				issuer: issuer,
				audience: audience,
				claims: claims,
				notBefore: DateTime.Now,
				expires: expires,
				signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));

			var customerId = await ResolveCustomerIdAsync(user.Id, user.Email, user.PhoneNumber);

			return new AuthTokenResponseDto
			{
				UserId = user.Id,
				CustomerId = customerId,
				AccessToken = new JwtSecurityTokenHandler().WriteToken(jwt),
				Expires = expires,
				ExpiresString = expires.ToString("yyyy-MM-dd HH:MM:ss"),
				RefreshToken = refreshToken,
				FullName = user.FullName,
				Username = user.UserName,
				Email = user.Email ?? string.Empty,
				PhoneNumber = user.PhoneNumber ?? string.Empty,
				Claims = claims.Select(x => new AuthClaimDto
				{
					Type = x.Type,
					Value = x.Value
				}).ToList(),
				Privileges = privileges
			};
		}

		private async Task<int?> ResolveCustomerIdAsync(int userId, string? email, string? phoneNumber)
		{
			var normalizedEmail = Normalize(email);
			var normalizedPhone = Normalize(phoneNumber);

			var customer = await GetDbContext().Customers
				.AsNoTracking()
				.Where(x =>
					x.userid == userId ||
					(!string.IsNullOrWhiteSpace(normalizedEmail) && x.mail == normalizedEmail) ||
					(!string.IsNullOrWhiteSpace(normalizedPhone) && x.phone == normalizedPhone))
				.OrderBy(x => x.id)
				.Select(x => new { x.id })
				.FirstOrDefaultAsync();

			return customer?.id;
		}

	}
}
