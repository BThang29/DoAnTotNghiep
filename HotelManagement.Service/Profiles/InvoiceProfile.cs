using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Invoices;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class InvoiceDtoToEntity : Profile
	{
		public InvoiceDtoToEntity()
		{
			CreateMap<InvoiceCreateDto, Invoice>();
		}
	}

	public class InvoiceEntityToDto : Profile
	{
		public InvoiceEntityToDto()
		{
			CreateMap<InvoiceGridView, InvoiceGridDto>();
		}
	}
}
