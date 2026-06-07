using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class EmailService
	{
		private const string templatePath = @"C:\Users\Admin\Desktop\at_smpservice-dev\at_smpservice-dev\EPS.Service\Dtos\Email\templates\forgot.html";
		private readonly SMTPConfigModel _smtpConfig;

		public async Task SendBookingCreatedEmail(
			string toEmail,
			string customerName,
			int bookingId,
			string roomName,
			decimal? roomPrice,
			DateTime dateStart,
			DateTime dateEnd,
			decimal? deposit,
			string? voucherCode)
		{
			var options = new UserEmailOptions
			{
				ToEmails = toEmail,
				Subject = $"Xac nhan dat phong #{bookingId}",
				Body = BuildBookingCreatedHtml(customerName, bookingId, roomName, roomPrice, dateStart, dateEnd, deposit, voucherCode)
			};

			await SendEmail(options);
		}

		public async Task SendForgotPasswordEmail(string toEmail, string userName, string newPassword)
		{
			var options = new UserEmailOptions
			{
				ToEmails = toEmail,
				Subject = "Khoi phuc mat khau tai khoan Telly Hotel",
				Body = BuildForgotPasswordHtml(toEmail, userName, newPassword)
			};

			await SendEmail(options);
		}

		public async Task SendGuestChatVerificationEmail(string toEmail, string guestName, string verificationCode)
		{
			var options = new UserEmailOptions
			{
				ToEmails = toEmail,
				Subject = "Ma xac minh chat khach vang lai",
				Body = BuildGuestChatVerificationHtml(toEmail, guestName, verificationCode)
			};

			await SendEmail(options);
		}

		public async Task SendPaymentCompletedEmail(
			string toEmail,
			string customerName,
			int invoiceId,
			int bookingId,
			string roomName,
			decimal? roomPrice,
			DateTime dateStart,
			DateTime dateEnd,
			decimal? deposit,
			decimal totalAmount,
			string paymentMethod,
			DateTime paidAt)
		{
			var options = new UserEmailOptions
			{
				ToEmails = toEmail,
				Subject = $"Xac nhan thanh toan hoa don #{invoiceId}",
				Body = BuildPaymentCompletedHtml(customerName, invoiceId, bookingId, roomName, roomPrice, dateStart, dateEnd, deposit, totalAmount, paymentMethod, paidAt)
			};

			await SendEmail(options);
		}

		public async Task SendTestEmail(UserEmailOptions userEmailOptions, string newPass)
		{
			userEmailOptions.Subject = UpdatePlaceHolders("Hello " + userEmailOptions.ToEmails.Split("@")[0] + " , This is mail to send password of you", userEmailOptions.PlaceHolders);

			userEmailOptions.Body = "Your new password is : " + newPass;

			await SendEmail(userEmailOptions);
		}

		public async Task SendMailConfirm(UserEmailOptions userEmailOptions, List<string> infor)
		{
			//userEmailOptions.Subject = UpdatePlaceHolders("Hello " + userEmailOptions.ToEmails.Split("@")[0] + " , This is mail to send password of you", userEmailOptions.PlaceHolders);

			userEmailOptions.Body = "Hello " + userEmailOptions.ToEmails + ", Your new password is : " + userEmailOptions.Subject;

			await SendEmail(userEmailOptions);
		}

		public async Task SendEmailForEmailConfirmation(UserEmailOptions userEmailOptions)
		{
			//userEmailOptions.Subject = userEmailOptions.Subject;

			//userEmailOptions.Body = UpdatePlaceHolders(GetEmailBody("EmailConfirm"), userEmailOptions.PlaceHolders);

			await SendEmail(userEmailOptions);
		}

		public async Task SendEmailForForgotPassword(UserEmailOptions userEmailOptions)
		{
			userEmailOptions.Subject = UpdatePlaceHolders("Hello {{UserName}}, reset your password.", userEmailOptions.PlaceHolders);

			userEmailOptions.Body = UpdatePlaceHolders(GetEmailBody("ForgotPassword"), userEmailOptions.PlaceHolders);

			await SendEmail(userEmailOptions);
		}

		public EmailService(IOptions<SMTPConfigModel> smtpConfig)
		{
			_smtpConfig = smtpConfig.Value;
		}

		private async Task SendEmail(UserEmailOptions userEmailOptions)
		{
			ValidateEmailSettings();

			using var mail = new MailMessage
			{
				Subject = userEmailOptions.Subject,
				Body = userEmailOptions.Body,
				From = new MailAddress(
					_smtpConfig.SenderAddress.Trim(),
					string.IsNullOrWhiteSpace(_smtpConfig.SenderDisplayName) ? _smtpConfig.SenderAddress.Trim() : _smtpConfig.SenderDisplayName.Trim()),
				IsBodyHtml = _smtpConfig.IsBodyHTML,
				BodyEncoding = Encoding.UTF8,
				SubjectEncoding = Encoding.UTF8
			};

			mail.To.Add(userEmailOptions.ToEmails.Trim());

			using var smtpClient = new SmtpClient
			{
				Host = _smtpConfig.Host.Trim(),
				Port = _smtpConfig.Port,
				EnableSsl = _smtpConfig.EnableSSL,
				UseDefaultCredentials = false,
				Credentials = new NetworkCredential(
					_smtpConfig.UserName.Trim(),
					_smtpConfig.Password.Trim()),
				DeliveryMethod = SmtpDeliveryMethod.Network,
				Timeout = 30000
			};

			await smtpClient.SendMailAsync(mail);
		}

		private void ValidateEmailSettings()
		{
			if (string.IsNullOrWhiteSpace(_smtpConfig.Host))
			{
				throw new InvalidOperationException("EmailConfiguration:Host is required.");
			}

			if (string.IsNullOrWhiteSpace(_smtpConfig.UserName))
			{
				throw new InvalidOperationException("EmailConfiguration:UserName is required.");
			}

			if (string.IsNullOrWhiteSpace(_smtpConfig.Password))
			{
				throw new InvalidOperationException("EmailConfiguration:Password is required.");
			}

			if (string.IsNullOrWhiteSpace(_smtpConfig.SenderAddress))
			{
				throw new InvalidOperationException("EmailConfiguration:SenderAddress is required.");
			}

			if (_smtpConfig.Port <= 0)
			{
				throw new InvalidOperationException("EmailConfiguration:Port must be greater than 0.");
			}
		}

		private string GetEmailBody(string templateName)
		{
			var body = File.ReadAllText(string.Format(templatePath, templateName));
			return body;
		}

		private string UpdatePlaceHolders(string text, List<KeyValuePair<string, string>> keyValuePairs)
		{
			if (!string.IsNullOrEmpty(text) && keyValuePairs != null)
			{
				foreach (var placeholder in keyValuePairs)
				{
					if (text.Contains(placeholder.Key))
					{
						text = text.Replace(placeholder.Key, placeholder.Value);
					}
				}
			}

			return text;
		}

		private static string BuildBookingCreatedHtml(
			string customerName,
			int bookingId,
			string roomName,
			decimal? roomPrice,
			DateTime dateStart,
			DateTime dateEnd,
			decimal? deposit,
			string? voucherCode)
		{
			var safeCustomerName = WebUtility.HtmlEncode(customerName);
			var safeRoomName = WebUtility.HtmlEncode(roomName);
			var safeVoucherCode = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(voucherCode) ? "Khong ap dung" : voucherCode);
			var roomPriceText = roomPrice.HasValue ? string.Format("{0:N0} VND", roomPrice.Value) : "Dang cap nhat";
			var depositText = deposit.HasValue ? string.Format("{0:N0} VND", deposit.Value) : "0 VND";

			return $@"
					<!DOCTYPE html>
					<html lang='vi'>
					<head>
						<meta charset='utf-8' />
						<title>Xác nhận đặt phòng/ Booking confirm</title>
					</head>
					<body style='margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#24324a;'>
						<div style='max-width:680px;margin:24px auto;padding:0 16px;'>
							<div style='background:linear-gradient(135deg,#2f6fed,#1849a9);border-radius:20px 20px 0 0;padding:28px 32px;color:#ffffff;'>
								<div style='font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:.85;'>Hotel Management</div>
								<h2 style='margin:10px 0 0;font-size:28px;line-height:1.2;'>Xác nhận đặt phòng thành công/ Booking confirmed. </h2>
								<p style='margin:10px 0 0;font-size:15px;line-height:1.6;opacity:.92;'>Cảm ơn khách hàng {safeCustomerName}. Yêu cầu dặt phòng của bạn đã được ghi nhận trong hệ thống.</p>
								<p style='margin:10px 0 0;font-size:15px;line-height:1.6;opacity:.92;'>Thank you {safeCustomerName}. your reservation request is saved in our system .</p>
							</div>
							<div style='background:#ffffff;border-radius:0 0 20px 20px;padding:28px 32px;box-shadow:0 16px 40px rgba(15,23,42,.08);'>
								<div style='margin-bottom:20px;padding:18px 20px;border:1px solid #dbe6f5;border-radius:16px;background:#f8fbff;'>
									<div style='font-size:13px;color:#6b7a90;margin-bottom:6px;'>Mã Booking/Booking ID</div>
									<div style='font-size:32px;font-weight:700;color:#1849a9;'>#{bookingId}</div>
								</div>
								<table style='width:100%;border-collapse:collapse;'>
									<tr>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Khách hàng/Customer</td>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{safeCustomerName}</td>
									</tr>
                <tr>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Phòng/Room</td>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{safeRoomName}</td>
                </tr>
                <tr>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Giá phòng/Price</td>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{roomPriceText}</td>
                </tr>
                <tr>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Ngày nhận/Check-in date</td>
                    <td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{dateStart:dd/MM/yyyy}</td>
									</tr>
									<tr>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Ngày trả/Check-out date</td>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{dateEnd:dd/MM/yyyy}</td>
									</tr>
									<tr>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;color:#6b7a90;'>Tiền cọc/Deposit</td>
										<td style='padding:12px 0;border-bottom:1px solid #edf2f7;text-align:right;font-weight:700;'>{depositText}</td>
									</tr>
									<tr>
										<td style='padding:12px 0;color:#6b7a90;'>Mã giảm giá/Voucher</td>
										<td style='padding:12px 0;text-align:right;font-weight:700;'>{safeVoucherCode}</td>
									</tr>
								</table>
								<p style='margin:24px 0 0;font-size:14px;line-height:1.7;color:#5b667a;'>
									Nếu cần thay đổi thông tin. Vui lòng liên hệ bộ phận lễ tân để được hỗ trợ sớm nhất.
                                    (If you need to change the information, please contact the reception for the earliest support.)
								</p>
							</div>
						</div>
					</body>
					</html>";
		}

		private static string BuildForgotPasswordHtml(string toEmail, string userName, string newPassword)
		{
			var safeEmail = WebUtility.HtmlEncode(toEmail);
			var safeUserName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(userName) ? toEmail.Split('@')[0] : userName);
			var safePassword = WebUtility.HtmlEncode(newPassword);

			return $@"
					<!DOCTYPE html>
					<html lang='vi'>
					<head>
						<meta charset='utf-8' />
						<title>Khoi phuc mat khau</title>
					</head>
					<body style='margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#24324a;'>
						<div style='max-width:680px;margin:24px auto;padding:0 16px;'>
							<div style='background:linear-gradient(135deg,#dfa974,#c58a54);border-radius:20px 20px 0 0;padding:28px 32px;color:#ffffff;'>
								<div style='font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:.85;'>Telly Hotel</div>
								<h2 style='margin:10px 0 0;font-size:28px;line-height:1.2;'>Khoi phuc mat khau thanh cong</h2>
								<p style='margin:10px 0 0;font-size:15px;line-height:1.6;opacity:.92;'>Xin chao {safeUserName}, he thong da tao mat khau moi cho tai khoan cua ban.</p>
							</div>
							<div style='background:#ffffff;border-radius:0 0 20px 20px;padding:28px 32px;box-shadow:0 16px 40px rgba(15,23,42,.08);'>
								<p style='margin:0 0 18px;font-size:15px;line-height:1.7;color:#5b667a;'>Ban da yeu cau khoi phuc mat khau. Vui long dang nhap bang thong tin ben duoi va doi mat khau ngay sau khi vao he thong.</p>
								<div style='margin-bottom:20px;padding:18px 20px;border:1px solid #dbe6f5;border-radius:16px;background:#f8fbff;'>
									<div style='font-size:13px;color:#6b7a90;margin-bottom:6px;'>Email dang nhap</div>
									<div style='font-size:18px;font-weight:700;color:#1849a9;word-break:break-word;'>{safeEmail}</div>
								</div>
								<div style='margin-bottom:20px;padding:18px 20px;border:1px solid #f3d7b8;border-radius:16px;background:#fff8f1;'>
									<div style='font-size:13px;color:#9a6b3f;margin-bottom:6px;'>Mat khau moi</div>
									<div style='font-size:32px;font-weight:700;letter-spacing:4px;color:#c58a54;'>{safePassword}</div>
								</div>
								<p style='margin:24px 0 0;font-size:14px;line-height:1.7;color:#5b667a;'>Neu ban khong thuc hien yeu cau nay, vui long lien he quan tri he thong hoac bo phan le tan de duoc ho tro ngay.</p>
							</div>
						</div>
					</body>
					</html>";
		}

		private static string BuildGuestChatVerificationHtml(string toEmail, string guestName, string verificationCode)
		{
			var safeEmail = WebUtility.HtmlEncode(toEmail);
			var safeGuestName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(guestName) ? "Khach hang" : guestName);
			var safeCode = WebUtility.HtmlEncode(verificationCode);

			return $@"
					<!DOCTYPE html>
					<html lang='vi'>
					<head>
						<meta charset='utf-8' />
						<title>Xac minh email chat</title>
					</head>
					<body style='margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#24324a;'>
						<div style='max-width:680px;margin:24px auto;padding:0 16px;'>
							<div style='background:linear-gradient(135deg,#2f6fed,#1849a9);border-radius:20px 20px 0 0;padding:28px 32px;color:#ffffff;'>
								<div style='font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:.85;'>Telly Hotel Chat</div>
								<h2 style='margin:10px 0 0;font-size:28px;line-height:1.2;'>Xac minh email khach vang lai</h2>
								<p style='margin:10px 0 0;font-size:15px;line-height:1.6;opacity:.92;'>Xin chao {safeGuestName}, vui long dung ma ben duoi de xac minh email cho cuoc hoi thoai voi le tan.</p>
							</div>
							<div style='background:#ffffff;border-radius:0 0 20px 20px;padding:28px 32px;box-shadow:0 16px 40px rgba(15,23,42,.08);'>
								<div style='margin-bottom:20px;padding:18px 20px;border:1px solid #dbe6f5;border-radius:16px;background:#f8fbff;'>
									<div style='font-size:13px;color:#6b7a90;margin-bottom:6px;'>Email</div>
									<div style='font-size:18px;font-weight:700;color:#1849a9;word-break:break-word;'>{safeEmail}</div>
								</div>
								<div style='margin-bottom:20px;padding:18px 20px;border:1px solid #dbe6f5;border-radius:16px;background:#f8fbff;'>
									<div style='font-size:13px;color:#6b7a90;margin-bottom:6px;'>Ma xac minh</div>
									<div style='font-size:32px;font-weight:700;letter-spacing:4px;color:#1849a9;'>{safeCode}</div>
								</div>
								<p style='margin:24px 0 0;font-size:14px;line-height:1.7;color:#5b667a;'>Ma co hieu luc trong 10 phut. Neu ban khong yeu cau, vui long bo qua email nay.</p>
							</div>
						</div>
					</body>
					</html>";
		}

		private static string BuildPaymentCompletedHtml(
			string customerName,
			int invoiceId,
			int bookingId,
			string roomName,
			decimal? roomPrice,
			DateTime dateStart,
			DateTime dateEnd,
			decimal? deposit,
			decimal totalAmount,
			string paymentMethod,
			DateTime paidAt)
		{
			var safeCustomerName = WebUtility.HtmlEncode(customerName);
			var safeRoomName = WebUtility.HtmlEncode(roomName);
			var safePaymentMethod = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(paymentMethod) ? "Khong xac dinh" : paymentMethod);
			var roomPriceText = roomPrice.HasValue ? string.Format("{0:N0} VND", roomPrice.Value) : "Dang cap nhat";
			var depositText = deposit.HasValue ? string.Format("{0:N0} VND", deposit.Value) : "0 VND";
			var totalAmountText = string.Format("{0:N0} VND", totalAmount);

			return $@"
					<!DOCTYPE html>
					<html lang='vi'>
					<head>
						<meta charset='utf-8' />
						<title>Xac nhan thanh toan</title>
					</head>
					<body style='margin:0;padding:24px 0;background:#f3efe7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;'>
						<div style='max-width:720px;margin:0 auto;padding:0 16px;'>
							<div style='background:linear-gradient(135deg,#182230,#2f435d);border-radius:24px 24px 0 0;padding:32px;color:#fff;'>
								<div style='font-size:12px;letter-spacing:1.6px;text-transform:uppercase;opacity:.78;'>Telly Hotel</div>
								<h1 style='margin:12px 0 10px;font-size:30px;line-height:1.2;'>Thanh toán đã được ghi nhận</h1>
								<p style='margin:0;font-size:15px;line-height:1.7;opacity:.92;'>Xin chao {safeCustomerName}, he thong da xac nhan giao dich cho booking #{bookingId}. Thong tin hoa don va luu tru cua ban duoc tong hop ben duoi.</p>
							</div>
							<div style='background:#ffffff;border-radius:0 0 24px 24px;padding:32px;box-shadow:0 20px 44px rgba(15,23,42,.08);'>
								<div style='display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;'>
									<div style='flex:1;min-width:220px;padding:18px 20px;border-radius:18px;background:#f8fafc;border:1px solid #d7e0ea;'>
										<div style='font-size:13px;color:#64748b;margin-bottom:6px;'>Ma hoa don</div>
										<div style='font-size:28px;font-weight:700;color:#0f172a;'>#{invoiceId}</div>
									</div>
									<div style='flex:1;min-width:220px;padding:18px 20px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;'>
										<div style='font-size:13px;color:#9a3412;margin-bottom:6px;'>Tong thanh toan</div>
										<div style='font-size:28px;font-weight:700;color:#c2410c;'>{totalAmountText}</div>
									</div>
								</div>
								<table style='width:100%;border-collapse:collapse;'>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Booking</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>#{bookingId}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Phong</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{safeRoomName}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Gia phong</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{roomPriceText}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Ngay nhan phong</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{dateStart:dd/MM/yyyy}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Ngay tra phong</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{dateEnd:dd/MM/yyyy}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Tien coc</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{depositText}</td></tr>
									<tr><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;'>Phuong thuc</td><td style='padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;'>{safePaymentMethod}</td></tr>
									<tr><td style='padding:12px 0;color:#6b7280;'>Thoi gian thanh toan</td><td style='padding:12px 0;text-align:right;font-weight:700;'>{paidAt:dd/MM/yyyy HH:mm}</td></tr>
								</table>
								<p style='margin:24px 0 0;font-size:14px;line-height:1.7;color:#4b5563;'>Cam on ban da thanh toan. Email nay dong vai tro xac nhan giao dich. Neu can dieu chinh thong tin dat phong, vui long lien he le tan va cung cap ma booking #{bookingId} hoac hoa don #{invoiceId}.</p>
							</div>
						</div>
					</body>
					</html>";
		}
	}
}
