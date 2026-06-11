'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IconLoader2, IconCalendar, IconMapPin, IconInfoCircle, IconCheck } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SearchableSelect } from './searchable-select';

export interface Province {
  name: string;
  code: number;
}

export interface District {
  name: string;
  code: number;
}

export interface AreasScheduleData {
  methods: string[];
  teachingProvinceCode: string;
  teachingProvinceName: string;
  teachingDistrictCode: string;
  teachingDistrictName: string;
  schedule: Record<string, string[]>;
}

interface StepAreasScheduleProps {
  initialData: AreasScheduleData;
  onChange: (data: AreasScheduleData) => void;
  onValidityChange: (isValid: boolean) => void;
  provinces: Province[];
  loadingProvinces: boolean;
  isReadOnly: boolean;
}

const METHODS = ['Online', 'Tại nhà (Offline)', 'Cả hai (Onlive + Offlive)'];
const SESSIONS = ['Sáng', 'Chiều', 'Tối'];
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function StepAreasSchedule({
  initialData,
  onChange,
  onValidityChange,
  provinces,
  loadingProvinces,
  isReadOnly
}: StepAreasScheduleProps) {
  const [data, setData] = useState<AreasScheduleData>(initialData);

  const [teachingDistricts, setTeachingDistricts] = useState<District[]>([]);
  const [loadingTeachingDistricts, setLoadingTeachingDistricts] = useState(false);

  // Validate fields
  const isValid = useMemo(() => {
    if (data.methods.length === 0) return false;

    const needsLocation = data.methods.some(m => m.includes('Tại nhà') || m.includes('Cả hai'));
    if (needsLocation && (!data.teachingProvinceCode || !data.teachingDistrictCode)) return false;

    const hasSchedule = Object.values(data.schedule).some(sessions => sessions && sessions.length > 0);
    if (!hasSchedule) return false;

    return true;
  }, [data]);



  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  // Find teachingProvinceCode when provinces list or teachingProvinceName changes
  useEffect(() => {
    if (provinces.length === 0 || !data.teachingProvinceName || data.teachingProvinceCode) return;

    const matched = provinces.find(p =>
      p.name.toLowerCase().includes(data.teachingProvinceName.toLowerCase()) ||
      data.teachingProvinceName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      setData(prev => ({
        ...prev,
        teachingProvinceCode: matched.code.toString(),
        teachingProvinceName: matched.name
      }));
    }
  }, [provinces, data.teachingProvinceName, data.teachingProvinceCode]);

  // Fetch teaching districts list when teachingProvinceCode changes
  useEffect(() => {
    if (!data.teachingProvinceCode) {
      setTeachingDistricts([]);
      return;
    }

    const fetchTeachingDistricts = async () => {
      setLoadingTeachingDistricts(true);
      try {
        const res = await fetch(`/api/provinces?code=${data.teachingProvinceCode}`);
        if (res.ok) {
          const dataRes = await res.json();
          const districtsList = dataRes.districts || dataRes.wards || [];
          setTeachingDistricts(Array.isArray(districtsList) ? districtsList : []);
        }
      } catch (err) {
        console.error('Error fetching teaching districts list:', err);
      } finally {
        setLoadingTeachingDistricts(false);
      }
    };
    fetchTeachingDistricts();
  }, [data.teachingProvinceCode]);

  // Find teachingDistrictCode when districts list or teachingDistrictName changes
  useEffect(() => {
    if (teachingDistricts.length === 0 || !data.teachingDistrictName || data.teachingDistrictCode) return;

    const matched = teachingDistricts.find(d =>
      d.name.toLowerCase().includes(data.teachingDistrictName.toLowerCase()) ||
      data.teachingDistrictName.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matched) {
      setData(prev => ({
        ...prev,
        teachingDistrictCode: matched.code.toString(),
        teachingDistrictName: matched.name
      }));
    }
  }, [teachingDistricts, data.teachingDistrictName, data.teachingDistrictCode]);

  // Handlers
  const handleTeachingProvinceChange = useCallback(async (code: string) => {
    const name = provinces.find(p => p.code.toString() === code)?.name || '';
    setData(prev => ({
      ...prev,
      teachingProvinceCode: code,
      teachingProvinceName: name,
      teachingDistrictCode: '',
      teachingDistrictName: '',
    }));
    setTeachingDistricts([]);

    if (!code) return;

    setLoadingTeachingDistricts(true);
    try {
      const res = await fetch(`/api/provinces?code=${code}`);
      if (res.ok) {
        const dataRes = await res.json();
        const districtsList = dataRes.districts || dataRes.wards || [];
        setTeachingDistricts(Array.isArray(districtsList) ? districtsList : []);
      }
    } catch (err) {
      console.error('Error fetching teaching districts:', err);
    } finally {
      setLoadingTeachingDistricts(false);
    }
  }, [provinces]);

  const handleTeachingDistrictChange = useCallback((code: string) => {
    const name = teachingDistricts.find(d => d.code.toString() === code)?.name || '';
    setData(prev => ({
      ...prev,
      teachingDistrictCode: code,
      teachingDistrictName: name,
    }));
  }, [teachingDistricts]);

  const handleToggleMethod = useCallback((method: string) => {
    setData(prev => {
      const exists = prev.methods.includes(method);
      // Single select: chỉ cho phép 1 hình thức
      const updatedMethods = exists ? [] : [method];
      return {
        ...prev,
        methods: updatedMethods
      };
    });
  }, []);

  const toggleSchedule = useCallback((day: string, session: string) => {
    setData(prev => {
      const cur = prev.schedule[day] ?? [];
      const updatedSessions = cur.includes(session)
        ? cur.filter(x => x !== session)
        : [...cur, session];
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: updatedSessions
        }
      };
    });
  }, []);

  // Memoized Options
  const provinceOptions = useMemo(() => {
    return provinces.map(p => ({ value: p.code.toString(), label: p.name }));
  }, [provinces]);

  const teachingDistrictOptions = useMemo(() => {
    return teachingDistricts.map(d => ({ value: d.code.toString(), label: d.name }));
  }, [teachingDistricts]);

  return (
    <div className='space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300'>
      {/* Hình thức & Địa điểm */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <h2 className='font-bold text-lg mb-1 flex items-center gap-2 text-foreground'><IconMapPin size={18} className='text-primary' />Hình thức & Khu vực giảng dạy</h2>
        <p className='text-xs text-muted-foreground -mt-2'>Chọn phương thức giảng dạy phù hợp với khả năng di chuyển của bạn.</p>

        <div className='space-y-4'>
          {/* Phương thức giảng dạy */}
          <div className='space-y-2'>
            <Label className='text-xs text-muted-foreground block font-semibold'>Phương thức giảng dạy <span className='text-red-500'>*</span></Label>
            <div className='flex flex-wrap gap-2.5'>
              {METHODS.map((m) => {
                const selected = data.methods.includes(m);
                return (
                  <button
                    key={m}
                    type='button'
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && handleToggleMethod(m)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm',
                      isReadOnly ? 'cursor-not-allowed opacity-70 pointer-events-none' : '',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    {selected && <IconCheck size={14} />}
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khu vực dạy Offline */}
          {data.methods.some(m => m.includes('Tại nhà') || m.includes('Cả hai')) && (
            <div className='grid gap-4 sm:grid-cols-2 p-4 bg-muted/20 rounded-xl border border-dashed animate-in fade-in duration-350'>
              <div className='space-y-1.5 sm:col-span-2 flex items-center gap-1.5 text-xs text-primary font-medium'>
                <IconInfoCircle size={14} /> Chọn khu vực bạn có thể di chuyển qua nhà học sinh để dạy trực tiếp (Offline):
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                  Tỉnh/Thành phố <span className='text-red-500'>*</span>
                  {loadingProvinces && <IconLoader2 size={12} className='animate-spin text-primary' />}
                </Label>
                <SearchableSelect
                  value={data.teachingProvinceCode}
                  onValueChange={handleTeachingProvinceChange}
                  options={provinceOptions}
                  placeholder='Tìm và chọn Tỉnh/Thành'
                  disabled={loadingProvinces || isReadOnly}
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                  Xã/Phường <span className='text-red-500'>*</span>
                  {loadingTeachingDistricts && <IconLoader2 size={12} className='animate-spin text-primary' />}
                </Label>
                <SearchableSelect
                  value={data.teachingDistrictCode}
                  onValueChange={handleTeachingDistrictChange}
                  options={teachingDistrictOptions}
                  placeholder='Tìm và chọn Xã/Phường'
                  disabled={loadingTeachingDistricts || !data.teachingProvinceCode || isReadOnly}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lịch dạy rảnh */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <div>
          <h2 className='font-bold text-lg flex items-center gap-2 text-foreground'><IconCalendar size={18} className='text-primary' />Thời gian rảnh hàng tuần</h2>
          <p className='text-xs text-muted-foreground mt-1'>
            Vui lòng đánh dấu những buổi bạn có thể nhận lớp. Gia sư có lịch rảnh linh hoạt sẽ dễ được ghép lớp thành công hơn.
          </p>
        </div>

        <div className='overflow-x-auto border rounded-xl bg-muted/5'>
          <table className='w-full border-collapse text-sm text-center min-w-[500px]'>
            <thead>
              <tr className='bg-muted/40 border-b font-medium text-muted-foreground text-xs'>
                <th className='py-3 px-4 text-left font-semibold w-[120px]'>Buổi học \ Ngày</th>
                {DAYS.map(d => <th key={d} className='py-3 px-1 font-bold'>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map((session, idx) => (
                <tr key={session} className={cn('border-b last:border-0 hover:bg-muted/10 transition-colors', idx % 2 === 0 ? 'bg-background' : 'bg-muted/5')}>
                  <td className='py-4 px-4 text-left font-bold text-xs text-foreground bg-muted/10'>{session}</td>
                  {DAYS.map(day => {
                    const active = (data.schedule[day] ?? []).includes(session);
                    return (
                      <td key={day} className='py-2 px-1'>
                        <button
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => !isReadOnly && toggleSchedule(day, session)}
                          className={cn(
                            'mx-auto h-8 w-11/12 rounded-lg border font-semibold text-xs transition-all duration-200 flex items-center justify-center',
                            isReadOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-primary/50',
                            active
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]'
                              : 'bg-background border-border text-muted-foreground/60'
                          )}
                        >
                          {active ? 'Rảnh' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
