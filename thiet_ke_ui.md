1. Template Method (Mẫu Phương Thức Khuôn Mẫu)
Bản chất: Định nghĩa một "bộ khung" (skeleton) của một quy trình gồm nhiều bước. Các class con sẽ kế thừa bộ khung này và chỉ ghi đè (override) những bước có logic đặc thù, giữ nguyên trình tự của bộ khung.

Áp dụng trong TutorNet:

- Tính năng Xuất dữ liệu (Export Excel/CSV): Bạn đang có API /api/v1/admin/contracts/export. Tương lai bạn sẽ cần xuất cả Gia sư, Học viên, Doanh thu. Quy trình xuất file luôn cố định: Tạo file -> Tạo Header -> Lấy Data -> Ghi Data vào dòng -> Lưu/Trả file.

- Bộ khung (Abstract Class): BaseDataExporter chứa hàm export() gọi tuần tự các bước trên.

- Lớp con: ContractExporter, TutorExporter chỉ cần ghi đè bước Lấy Data (truy vấn từ Repo nào) và Ghi Data vào dòng (format cột ra sao).

- Quy trình Xử lý Thanh toán (Payment Processing): Dựa vào bảng transactions có Enum payment_method (VNPAY, PAYOS, BANK_TRANSFER). Quy trình thanh toán chuẩn là: Validate Hợp đồng -> Tạo giao dịch trạng thái PENDING -> Gọi đối tác (VNPay/Momo) -> Cập nhật trạng thái.

- Bộ khung: AbstractPaymentProcessor lo việc tạo    Transaction, lưu DB và ghi log.

- Lớp con: VNPayProcessor và BankTransferProcessor chỉ ghi đè đoạn Gọi đối tác vì logic kết nối API mỗi bên là khác nhau.

- Quy trình Gửi Thông báo/Email:
Quy trình: Lấy template HTML -> Bơm dữ liệu (Variables) -> Gửi qua SMTP. Các luồng Gửi email chốt hợp đồng hay Gửi email nhắc đánh giá có thể kế thừa và chỉ ghi đè bước "Bơm dữ liệu".

2. Visitor Pattern (Mẫu Khách Viếng Thăm)
Bản chất: Cho phép bạn định nghĩa các thao tác mới (operation) trên một tập hợp các đối tượng (object structure) mà không cần phải sửa đổi code của các lớp đối tượng đó. Nó bóc tách thuật toán ra khỏi cấu trúc dữ liệu.

Áp dụng trong TutorNet: 
- Trích xuất / Kết xuất Hợp đồng PDF (PDF Document Generation):
Dựa trên file Hop_Dong_Ba_Ben_Dich_Vu_Gia_Su.pdf của bạn. Một bản Hợp đồng điện tử được cấu thành từ nhiều phần dữ liệu khác nhau: TutorProfile (Bên B), ClassRequest (Bên C), ContractDetails (Thông tin học phí).

Thay vì nhét logic render PDF vào từng Entity, bạn tạo một PdfRenderVisitor.

Visitor này sẽ "đi thăm" từng thành phần: visit(TutorProfile), visit(ClassRequest) để bóc tách đúng những trường dữ liệu cần thiết và vẽ lên thư viện PDF (như iText hay Apache PDFBox). Sau này muốn xuất ra file Word, bạn chỉ cần tạo thêm WordRenderVisitor mà không phải sửa DB Entities.

Hệ thống Tính phí / Chiết khấu phức tạp (Fee & Discount Calculation):
Hiện tại phí nhận lớp (Introduction Fee) đang lưu cứng. Nhưng sau này nếu bạn áp dụng logic: Lễ tết giảm 10%, Gia sư VIP được giảm phí, Học viên có mã giới thiệu.

Một FeeCalculatorVisitor có thể "đi thăm" TutorProfile (để check hạng VIP), "đi thăm" Contract (để check số tiền), "đi thăm" PromotionCode để tổng hợp lại và tính ra số tiền cuối cùng gia sư phải đóng.

Audit Logging (Ghi vết lịch sử thay đổi DB):
Bạn muốn lưu lại lịch sử thay đổi trạng thái của Hợp đồng, Hồ sơ gia sư hay Yêu cầu lớp. Một AuditLogVisitor có thể nhận vào bất kỳ Entity nào, trích xuất ID, Trạng thái cũ/mới và đóng gói thành một chuẩn JSON duy nhất để lưu vào bảng audit_logs (phục vụ đối soát).