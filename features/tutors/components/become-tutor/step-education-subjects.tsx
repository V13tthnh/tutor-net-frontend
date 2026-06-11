'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IconLoader2, IconUser, IconSchool, IconBook } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SubjectNode {
  id: number;
  name: string;
  parent_id?: number | null;
  children?: SubjectNode[];
}

export interface TutorSubject {
  id: number;
  name: string;
  hourlyRate: string;
  proficiencyLevel: string;
}

export interface EducationSubjectsData {
  headline: string;
  bio: string;
  educationLevel: string;
  experienceYears: string;
  occupation: string;
  studentYear: string;
  major: string;
  university: string;
  graduationYear: string;
  tutorSubjects: TutorSubject[];
  achievements: string;
}

interface StepEducationSubjectsProps {
  initialData: EducationSubjectsData;
  onChange: (data: EducationSubjectsData) => void;
  onValidityChange: (isValid: boolean) => void;
  subjectTree: SubjectNode[];
  loadingSubjects: boolean;
  isFlexibleReadOnly: boolean; // Thêm quyền 1
  isCriticalReadOnly: boolean; // Thêm quyền 2
}

const OCCUPATIONS = ['Sinh viên', 'Giáo viên', 'Giảng viên', 'Người đi làm'];

const PROFICIENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
  { value: 'EXPERT', label: 'Chuyên gia' },
];

const EDU_LEVEL_OPTIONS = [
  { value: 'HIGH_SCHOOL', label: 'Tốt nghiệp THPT' },
  { value: 'ASSOCIATE', label: 'Cao đẳng' },
  { value: 'BACHELOR', label: 'Đại học' },
  { value: 'MASTER', label: 'Thạc sĩ' },
  { value: 'PHD', label: 'Tiến sĩ' },
  { value: 'OTHER', label: 'Chứng chỉ nghề / Tự học' },
];

const formatVND = (value: string): string => {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(cleanValue));
};

const parseVND = (formattedValue: string): string => {
  if (!formattedValue) return '';
  return formattedValue.replace(/\D/g, '');
};

export function StepEducationSubjects({
  initialData,
  onChange,
  onValidityChange,
  subjectTree,
  loadingSubjects,
  isFlexibleReadOnly,
  isCriticalReadOnly
}: StepEducationSubjectsProps) {
  const [data, setData] = useState<EducationSubjectsData>(initialData);

  // Validate fields
  const isValid = useMemo(() => {
    if (!data.headline.trim()) return false;
    if (!data.bio.trim()) return false;
    if (!data.educationLevel) return false;
    if (!data.occupation) return false;
    if (data.occupation === 'Sinh viên' && (!data.studentYear || !data.major || data.major.trim() === '')) return false;
    if (data.tutorSubjects.length === 0) return false;

    const hasInvalidRate = data.tutorSubjects.some(s =>
      s.hourlyRate.trim() === '' ||
      isNaN(Number(s.hourlyRate)) ||
      Number(s.hourlyRate) <= 0
    );
    if (hasInvalidRate) return false;

    if (data.achievements.trim() === '') return false;

    return true;
  }, [data]);



  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  const handleFieldChange = useCallback((field: keyof EducationSubjectsData, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleToggleSubject = useCallback((subjectId: number, sName: string) => {
    setData(prev => {
      const exists = prev.tutorSubjects.find(s => s.id === subjectId);
      let updatedSubjects: TutorSubject[];
      if (exists) {
        updatedSubjects = prev.tutorSubjects.filter(s => s.id !== subjectId);
      } else {
        updatedSubjects = [...prev.tutorSubjects, { id: subjectId, name: sName, hourlyRate: '', proficiencyLevel: 'INTERMEDIATE' }];
      }
      return {
        ...prev,
        tutorSubjects: updatedSubjects
      };
    });
  }, []);

  const handleUpdateSubjectField = useCallback((subjectId: number, field: keyof Omit<TutorSubject, 'id' | 'name'>, value: string) => {
    setData(prev => ({
      ...prev,
      tutorSubjects: prev.tutorSubjects.map(s => {
        if (s.id === subjectId) {
          return { ...s, [field]: value };
        }
        return s;
      })
    }));
  }, []);

  const handleHourlyRateChange = useCallback((subjectId: number, rawInput: string) => {
    const numericString = parseVND(rawInput);
    handleUpdateSubjectField(subjectId, 'hourlyRate', numericString);
  }, [handleUpdateSubjectField]);

  return (
    <div className='space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300'>
      {/* Tiêu đề & Giới thiệu hồ sơ */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <h2 className='font-bold text-lg mb-1 flex items-center gap-2 text-foreground'><IconUser size={18} className='text-primary' />Thông tin hồ sơ gia sư</h2>
        <p className='text-xs text-muted-foreground -mt-2'>Đây là những thông tin hiển thị công khai trên trang gia sư của bạn.</p>

        <div className='space-y-4'>
          {/* Tiêu đề hồ sơ */}
          <div className='space-y-1.5'>
            <Label htmlFor='headline' className='text-xs text-muted-foreground'>Tiêu đề hồ sơ <span className='text-red-500'>*</span></Label>
            <Input
              id='headline'
              placeholder='Ví dụ: Gia sư Toán THPT – 5 năm kinh nghiệm, học sinh đạt 9+ điểm thi'
              className='h-10'
              value={data.headline}
              maxLength={255}
              onChange={e => handleFieldChange('headline', e.target.value)}
              disabled={isFlexibleReadOnly}
            />
            <p className='text-[10px] text-muted-foreground text-right'>{data.headline.length}/255</p>
          </div>

          {/* Giới thiệu bản thân */}
          <div className='space-y-1.5'>
            <Label htmlFor='bio' className='text-xs text-muted-foreground'>Giới thiệu bản thân <span className='text-red-500'>*</span></Label>
            <Textarea
              id='bio'
              placeholder='Mô tả về bản thân, phong cách giảng dạy, kinh nghiệm nổi bật, điểm mạnh... (tối đa 5000 ký tự)'
              rows={4}
              value={data.bio}
              maxLength={5000}
              onChange={e => handleFieldChange('bio', e.target.value)}
              disabled={isFlexibleReadOnly}
            />
            <p className='text-[10px] text-muted-foreground text-right'>{data.bio.length}/5000</p>
          </div>
        </div>
      </div>

      {/* Học vấn & Nghề nghiệp */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <h2 className='font-bold text-lg mb-2 flex items-center gap-2 text-foreground'><IconSchool size={18} className='text-primary' />Học vấn & Nghề nghiệp</h2>

        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            {/* Trình độ học văn */}
            <div className='space-y-1.5'>
              <Label className='text-xs text-muted-foreground'>Trình độ học vấn <span className='text-red-500'>*</span></Label>
              <Select value={data.educationLevel} onValueChange={val => handleFieldChange('educationLevel', val)} disabled={isCriticalReadOnly}>
                <SelectTrigger className='w-full h-10'>
                  <SelectValue placeholder='Chọn trình độ học vấn' />
                </SelectTrigger>
                <SelectContent>
                  {EDU_LEVEL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Số năm kinh nghiệm */}
            <div className='space-y-1.5'>
              <Label htmlFor='experienceYears' className='text-xs text-muted-foreground'>Số năm kinh nghiệm giảng dạy</Label>
              <Input
                id='experienceYears'
                type='number'
                placeholder='Ví dụ: 3'
                className='h-10'
                min={0} max={50}
                value={data.experienceYears}
                onChange={e => handleFieldChange('experienceYears', e.target.value)}
                disabled={isFlexibleReadOnly}
              />
            </div>

            {/* Nghề nghiệp */}
            <div className='space-y-1.5'>
              <Label className='text-xs text-muted-foreground'>Bạn đang là <span className='text-red-500'>*</span></Label>
              <Select value={data.occupation} onValueChange={val => handleFieldChange('occupation', val)} disabled={isCriticalReadOnly}>
                <SelectTrigger className='w-full h-10'>
                  <SelectValue placeholder='Chọn nghề nghiệp hiện tại' />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATIONS.map(occ => (
                    <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tên trường */}
            <div className='space-y-1.5'>
              <Label htmlFor='university' className='text-xs text-muted-foreground'>Trường đại học / Cơ sở đào tạo</Label>
              <Input
                id='university'
                placeholder='Ví dụ: ĐH Sư phạm Hà Nội'
                className='h-10'
                value={data.university}
                maxLength={255}
                onChange={e => handleFieldChange('university', e.target.value)}
                disabled={isCriticalReadOnly}
              />
            </div>

            {/* Năm tốt nghiệp */}
            <div className='space-y-1.5'>
              <Label htmlFor='graduationYear' className='text-xs text-muted-foreground'>Năm tốt nghiệp</Label>
              <Input
                id='graduationYear'
                type='number'
                placeholder='Ví dụ: 2022'
                className='h-10'
                min={1950} max={2100}
                value={data.graduationYear}
                onChange={e => handleFieldChange('graduationYear', e.target.value)}
                disabled={isCriticalReadOnly}
              />
            </div>
          </div>

          {/* Sinh viên — thêm năm học & chuyên ngành */}
          {data.occupation === 'Sinh viên' && (
            <div className='grid gap-4 sm:grid-cols-2 p-4 bg-muted/20 rounded-xl border border-dashed animate-in fade-in duration-200'>
              <div className='space-y-1.5'>
                <Label className='text-xs text-muted-foreground'>Sinh viên năm <span className='text-red-500'>*</span></Label>
                <Select value={data.studentYear} onValueChange={val => handleFieldChange('studentYear', val)} disabled={isCriticalReadOnly}>
                  <SelectTrigger className='w-full h-10 bg-background'>
                    <SelectValue placeholder='Chọn năm học' />
                  </SelectTrigger>
                  <SelectContent>
                    {['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4', 'Năm 5', 'Năm 6'].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='major' className='text-xs text-muted-foreground'>Chuyên ngành đào tạo <span className='text-red-500'>*</span></Label>
                <Input id='major' placeholder='Ví dụ: Sư phạm Toán, Công nghệ thông tin...' className='h-10 bg-background' value={data.major} onChange={e => handleFieldChange('major', e.target.value)} disabled={isCriticalReadOnly} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chọn môn học từ API subjects tree */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <h2 className='font-bold text-lg flex items-center gap-2 text-foreground'><IconBook size={18} className='text-primary' />Thông tin môn học ứng tuyển dạy</h2>

        <div className='space-y-4'>
          {/* Chọn các môn học */}
          <div className='space-y-3'>
            <Label className='text-xs text-muted-foreground block font-semibold'>Chọn các môn học bạn có thể dạy <span className='text-red-500'>*</span></Label>

            {loadingSubjects && (
              <div className='flex items-center gap-2 text-xs text-primary animate-pulse py-1'>
                <IconLoader2 size={14} className='animate-spin' />
                Đang tải danh sách môn học từ hệ thống...
              </div>
            )}

            <div className='space-y-4 max-h-[300px] overflow-y-auto pr-1 border rounded-lg p-3 bg-muted/5'>
              {useMemo(() => {
                return Array.isArray(subjectTree) && subjectTree.map(parent => (
                  <div key={parent.id} className='space-y-1.5 border-b last:border-0 pb-3 last:pb-0'>
                    <span className='text-[10px] font-bold text-muted-foreground/80 block tracking-wide uppercase px-1'>
                      {parent.name}
                    </span>
                    <div className='flex flex-wrap gap-1.5 pl-1'>
                      {Array.isArray(parent.children) && parent.children.map(child => {
                        const selected = data.tutorSubjects.some(sub => sub.id === child.id);
                        return (
                          <button key={child.id} type='button'
                            onClick={() => !isCriticalReadOnly && handleToggleSubject(child.id, child.name)}
                            disabled={isCriticalReadOnly}
                            className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                              isCriticalReadOnly ? 'cursor-not-allowed opacity-70 pointer-events-none' : '',
                              selected ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary')}>
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              }, [subjectTree, data.tutorSubjects, isCriticalReadOnly, handleToggleSubject])}
            </div>
          </div>

          {/* Danh sách môn học kèm học phí & chuyên môn (Input Group) */}
          {data.tutorSubjects.length > 0 && (
            <div className='space-y-3 pt-3 border-t animate-in fade-in duration-300'>
              <Label className='text-xs text-muted-foreground block font-semibold mb-1'>Cấu hình trình độ và học phí tương ứng:</Label>
              <div className='space-y-3.5'>
                {data.tutorSubjects.map((sub) => (
                  <div key={sub.name} className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/20 border rounded-xl hover:shadow-sm transition-all duration-200'>
                    <span className='font-bold text-sm text-foreground flex items-center gap-1.5 shrink-0'>
                      <span className='h-2 w-2 rounded-full bg-primary animate-pulse' />
                      Môn: {sub.name}
                    </span>

                    <div className='flex items-center flex-1 justify-end max-w-full sm:max-w-[340px]'>
                      {/* Input Group ghép sát nhau */}
                      <div className='flex items-center w-full rounded-lg border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all duration-200 shadow-sm'>
                        {/* Trình độ chuyên môn */}
                        <div className='w-[125px] shrink-0 border-r border-input bg-muted/5'>
                          <Select value={sub.proficiencyLevel} onValueChange={(val) => handleUpdateSubjectField(sub.id, 'proficiencyLevel', val)} disabled={isCriticalReadOnly}>
                            <SelectTrigger className='h-8 w-full bg-transparent text-xs border-0 focus:ring-0 rounded-none shadow-none px-2.5 focus:outline-none'>
                              <SelectValue placeholder='Trình độ' />
                            </SelectTrigger>
                            <SelectContent>
                              {PROFICIENCY_LEVELS.map(pl => (
                                <SelectItem key={pl.value} value={pl.value} className='text-xs'>{pl.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Học phí */}
                        <div className='relative flex-1'>
                          <input
                            type='text'
                            placeholder='Học phí/giờ'
                            className='h-8 w-full text-xs pr-10 pl-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60 font-medium disabled:opacity-70 disabled:cursor-not-allowed'
                            value={formatVND(sub.hourlyRate)}
                            onChange={(e) => handleHourlyRateChange(sub.id, e.target.value)}
                            disabled={isCriticalReadOnly}
                          />
                          <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/80 uppercase'>đ/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thành tích nổi bật */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='achievements' className='text-xs text-muted-foreground font-semibold flex items-center gap-1'>
            Thành tích nổi bật <span className='text-red-500'>*</span>
          </Label>
          <p className='text-[10px] text-muted-foreground -mt-1'>
            Ghi rõ các giải thưởng học thuật, chứng chỉ ngoại ngữ (IELTS, HSK...), điểm thi đại học cao hoặc thành tích nổi bật của học sinh cũ... để nâng cao uy tín hồ sơ.
          </p>
          <Textarea
            id='achievements'
            placeholder='Ví dụ:&#10;- Đạt giải Nhì Học sinh Giỏi cấp Tỉnh môn Toán lớp 12&#10;- Điểm thi Đại học khối A đạt 27.5 điểm (Toán 9.4, Lý 9.0, Hóa 9.1)&#10;- Có chứng chỉ IELTS 7.5 (Academic)&#10;- Đã kèm 3 học sinh lớp 12 tiến bộ từ trung bình lên khá giỏi, đỗ nguyện vọng 1'
            rows={5}
            value={data.achievements}
            maxLength={2000}
            onChange={e => handleFieldChange('achievements', e.target.value)}
            disabled={isCriticalReadOnly}
          />
          <p className='text-[10px] text-muted-foreground text-right'>{data.achievements.length}/2000</p>
        </div>
      </div>
    </div>
  );
}
