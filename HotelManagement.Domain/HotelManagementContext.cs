using DoAnWebQuanLyKhachSan.Data.Entities;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Data
{
    public partial class HotelManagementContext : DbContext, IDataProtectionKeyContext
    {
        public HotelManagementContext()
        {
        }

        public HotelManagementContext(DbContextOptions<HotelManagementContext> options)
            : base(options)
        {
        }

        public virtual DbSet<DataProtectionKey> DataProtectionKeys { get; set; }
        public virtual DbSet<IdentityClient> IdentityClients { get; set; }
        public virtual DbSet<IdentityRefreshToken> IdentityRefreshTokens { get; set; }
        public virtual DbSet<Booking> Bookings { get; set; }
        public virtual DbSet<BookingDetailView> BookingDetailViews { get; set; }
        public virtual DbSet<BookingGridView> BookingGridViews { get; set; }
        public virtual DbSet<BookingHistory> BookingHistories { get; set; }
        public virtual DbSet<ClientBookingHistoryView> ClientBookingHistoryViews { get; set; }
        public virtual DbSet<ClientOnlinePaymentResultView> ClientOnlinePaymentResultViews { get; set; }
        public virtual DbSet<ChatConversation> ChatConversations { get; set; }
        public virtual DbSet<Customer> Customers { get; set; }
        public virtual DbSet<CustomerLookupView> CustomerLookupViews { get; set; }
        public virtual DbSet<CustomerGroup> CustomerGroups { get; set; }
        public virtual DbSet<CustomerType> CustomerTypes { get; set; }
        public virtual DbSet<GroupMember> GroupMembers { get; set; }
        public virtual DbSet<InventoryDelivery> InventoryDeliveries { get; set; }
        public virtual DbSet<InventoryReceiving> InventoryReceivings { get; set; }
        public virtual DbSet<Invoice> Invoices { get; set; }
        public virtual DbSet<InvoiceDetailView> InvoiceDetailViews { get; set; }
        public virtual DbSet<InvoiceGridView> InvoiceGridViews { get; set; }
        public virtual DbSet<InvoiceDetail> InvoiceDetails { get; set; }
        public virtual DbSet<LostItem> LostItems { get; set; }
        public virtual DbSet<Message> Messages { get; set; }
        public virtual DbSet<Payment> Payments { get; set; }
        public virtual DbSet<PaymentGridView> PaymentGridViews { get; set; }
        public virtual DbSet<Review> Reviews { get; set; }
        public virtual DbSet<Privilege> Privileges { get; set; }
        public virtual DbSet<Role> Roles { get; set; }
        public virtual DbSet<RolePrivilege> RolePrivileges { get; set; }
        public virtual DbSet<Room> Rooms { get; set; }
        public virtual DbSet<RoomBookingScheduleView> RoomBookingScheduleViews { get; set; }
        public virtual DbSet<RoomGridView> RoomGridViews { get; set; }
        public virtual DbSet<RoomStatus> RoomStatuses { get; set; }
        public virtual DbSet<RoomType> RoomTypes { get; set; }
        public virtual DbSet<ServiceDetail> ServiceDetails { get; set; }
        public virtual DbSet<ServiceGridView> ServiceGridViews { get; set; }
        public virtual DbSet<ServiceType> ServiceTypes { get; set; }
        public virtual DbSet<StayingGuestView> StayingGuestViews { get; set; }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<UserPrivilege> UserPrivileges { get; set; }
        public virtual DbSet<UserRole> UserRoles { get; set; }
        public virtual DbSet<Voucher> Vouchers { get; set; }
        public virtual DbSet<Log> Logs { get; set; }
        
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                #warning To protect potentially sensitive information in your connection string, you should move it out of source code. See http://go.microsoft.com/fwlink/?LinkId=723263 for guidance on storing connection strings.
                optionsBuilder.UseLazyLoadingProxies().UseSqlServer("Server=localhost,1433;User ID=sa;Password=YourStrong@Passw0rd;Database=HotelManagement;Integrated Security=false;Encrypt=False;TrustServerCertificate=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.RoleId });
            });

            modelBuilder.Entity<UserPrivilege>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.PrivilegeId });
            });

            modelBuilder.Entity<RolePrivilege>(entity =>
            {
                entity.HasKey(e => new { e.RoleId, e.PrivilegeId });
            });

            modelBuilder.Entity<CustomerGroup>(entity =>
            {
                entity.HasKey(e => new { e.customer_id, e.group_id });
            });

            modelBuilder.Entity<GroupMember>(entity =>
            {
                entity.HasKey(e => new { e.group_id, e.fullname });
            });

            modelBuilder.Entity<BookingGridView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_BookingGrid");
            });

            modelBuilder.Entity<BookingDetailView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_BookingDetail");
            });

            modelBuilder.Entity<ClientBookingHistoryView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_ClientBookingHistory");
            });

            modelBuilder.Entity<ClientOnlinePaymentResultView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_ClientOnlinePaymentResult");
            });

            modelBuilder.Entity<CustomerLookupView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_CustomerLookup");
            });

            modelBuilder.Entity<InvoiceGridView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_InvoiceGrid");
            });

            modelBuilder.Entity<InvoiceDetailView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_InvoiceDetail");
            });

            modelBuilder.Entity<PaymentGridView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_PaymentGrid");
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.Property(e => e.rating)
                    .HasColumnType("decimal(3,1)");

                entity.HasIndex(e => e.booking_id)
                    .IsUnique();
            });

            modelBuilder.Entity<Booking>(entity =>
            {
                entity.Property(e => e.booking_status)
                    .HasDefaultValue(0);

                entity.Property(e => e.booking_exprire)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("DATEADD(MINUTE, 10, GETDATE())");

                entity.Property(e => e.guest_full_name)
                    .HasMaxLength(255);

                entity.Property(e => e.guest_email)
                    .HasMaxLength(255);

                entity.Property(e => e.guest_access_token)
                    .HasMaxLength(128);

                entity.HasIndex(e => e.guest_access_token)
                    .IsUnique()
                    .HasFilter("[guest_access_token] IS NOT NULL");
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasOne(e => e.Conversation)
                    .WithMany(e => e.Messages)
                    .HasForeignKey(e => e.conversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.customerName)
                    .IsRequired();

                entity.Property(e => e.guestToken)
                    .HasMaxLength(128);

                entity.Property(e => e.senderRole)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.conversationKey)
                    .IsRequired()
                    .HasMaxLength(128);

                entity.Property(e => e.createDate)
                    .HasColumnType("datetime");

                entity.Property(e => e.content)
                    .IsRequired();

                entity.Property(e => e.seen)
                    .HasColumnType("bit");

                entity.Property(e => e.seenDate)
                    .HasColumnType("datetime");

                entity.HasIndex(e => e.conversationId);
                entity.HasIndex(e => e.conversationKey);
                entity.HasIndex(e => e.customerId);
                entity.HasIndex(e => e.guestToken);
                entity.HasIndex(e => e.assignedAdminUserId);
            });

            modelBuilder.Entity<ChatConversation>(entity =>
            {
                entity.Property(e => e.conversationKey)
                    .IsRequired()
                    .HasMaxLength(128);

                entity.Property(e => e.guestSessionToken)
                    .HasMaxLength(128);

                entity.Property(e => e.guestDisplayName)
                    .HasMaxLength(255);

                entity.Property(e => e.guestEmail)
                    .HasMaxLength(255);

                entity.Property(e => e.guestPhone)
                    .HasMaxLength(32);

                entity.Property(e => e.verificationStatus)
                    .IsRequired()
                    .HasMaxLength(32);

                entity.Property(e => e.verificationCode)
                    .HasMaxLength(16);

                entity.Property(e => e.createdDate)
                    .HasColumnType("datetime");

                entity.Property(e => e.lastMessageDate)
                    .HasColumnType("datetime");

                entity.Property(e => e.verificationCodeExpiresAt)
                    .HasColumnType("datetime");

                entity.Property(e => e.verifiedAt)
                    .HasColumnType("datetime");

                entity.HasIndex(e => e.conversationKey)
                    .IsUnique();

                entity.HasIndex(e => e.customerId)
                    .IsUnique()
                    .HasFilter("[customerId] IS NOT NULL");

                entity.HasIndex(e => e.guestSessionToken)
                    .IsUnique()
                    .HasFilter("[guestSessionToken] IS NOT NULL");

                entity.HasIndex(e => e.assignedAdminUserId);
                entity.HasIndex(e => e.verificationStatus);
            });

            modelBuilder.Entity<RoomGridView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_RoomGrid");
            });

            modelBuilder.Entity<RoomBookingScheduleView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_RoomBookingSchedule");
            });

            modelBuilder.Entity<ServiceGridView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_ServiceGrid");
            });

            modelBuilder.Entity<StayingGuestView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_StayingGuest");
            });

            modelBuilder.Entity<InventoryDelivery>(entity =>
            {
                entity.HasKey(e => new { e.servicedetail_id, e.out_date });
            });

        }
    }
}
