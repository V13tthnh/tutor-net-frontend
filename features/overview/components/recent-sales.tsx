import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

const salesData = [
  {
    name: 'Nguyễn Thanh Tùng',
    subject: 'Toán lớp 10',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    fallback: 'TT',
    amount: '+250,000đ'
  },
  {
    name: 'Trần Thị Hà',
    subject: 'Tiếng Anh giao tiếp',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    fallback: 'TH',
    amount: '+300,000đ'
  },
  {
    name: 'Lê Minh Hải',
    subject: 'Vật Lý luyện thi ĐH',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    fallback: 'MH',
    amount: '+400,000đ'
  },
  {
    name: 'Phạm Đức Anh',
    subject: 'Hóa Học lớp 12',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    fallback: 'DA',
    amount: '+250,000đ'
  },
  {
    name: 'Hoàng Thị Yến',
    subject: 'Ngữ Văn cấp 2',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    fallback: 'HY',
    amount: '+200,000đ'
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Giao dịch nhận lớp</CardTitle>
        <CardDescription>Đã giao thành công 128 lớp trong tuần này.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {salesData.map((sale, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={sale.avatar} alt='Avatar' />
                <AvatarFallback>{sale.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{sale.name}</p>
                <p className='text-muted-foreground text-sm'>Nhận lớp: {sale.subject}</p>
              </div>
              <div className='ml-auto font-medium text-green-600 dark:text-green-400'>{sale.amount}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
