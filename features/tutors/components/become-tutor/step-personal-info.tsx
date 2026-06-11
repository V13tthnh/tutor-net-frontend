'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

export interface PersonalData {
  name: string;
  phone: string;
  email: string;
  gender: string;
  birthYear: string;
  hometownProvinceCode: string;
  hometownProvinceName: string;
  addressProvinceCode: string;
  addressProvinceName: string;
  addressDistrictCode: string;
  addressDistrictName: string;
  addressDetail: string;
  avatarUrl: string;
}

interface StepPersonalInfoProps {
  initialData: PersonalData;
  onChange: (data: PersonalData) => void;
  onValidityChange: (isValid: boolean) => void;
  provinces: Province[];
  loadingProvinces: boolean;
  isReadOnly: boolean;
}

export function StepPersonalInfo({
  initialData,
  onChange,
  onValidityChange,
  provinces,
  loadingProvinces,
  isReadOnly
}: StepPersonalInfoProps) {
  const [personal, setPersonal] = useState<PersonalData>(initialData);

  const [addressDistricts, setAddressDistricts] = useState<District[]>([]);
  const [loadingAddressDistricts, setLoadingAddressDistricts] = useState(false);

  // Validate fields
  const isValid = useMemo(() => {
    return (
      personal.name.trim() !== '' &&
      personal.phone.trim() !== '' &&
      personal.email.trim() !== '' &&
      personal.gender !== '' &&
      personal.birthYear.trim() !== '' &&
      personal.hometownProvinceCode !== '' &&
      personal.addressProvinceCode !== '' &&
      personal.addressDistrictCode !== '' &&
      personal.addressDetail.trim() !== ''
    );
  }, [personal]);



  // Bubble state changes up to parent
  useEffect(() => {
    onChange(personal);
  }, [personal, onChange]);

  // Report validity to parent
  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  // 1. Address Province lookup code by name
  useEffect(() => {
    if (provinces.length === 0 || !personal.addressProvinceName || personal.addressProvinceCode) return;

    const matched = provinces.find(p =>
      p.name.toLowerCase().includes(personal.addressProvinceName.toLowerCase()) ||
      personal.addressProvinceName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      setPersonal(prev => ({
        ...prev,
        addressProvinceCode: matched.code.toString(),
        addressProvinceName: matched.name
      }));
    }
  }, [provinces, personal.addressProvinceName, personal.addressProvinceCode]);

  // 2. Fetch address districts list when addressProvinceCode changes
  useEffect(() => {
    if (!personal.addressProvinceCode) {
      setAddressDistricts([]);
      return;
    }

    const fetchAddressDistricts = async () => {
      setLoadingAddressDistricts(true);
      try {
        const res = await fetch(`/api/provinces?code=${personal.addressProvinceCode}`);
        if (res.ok) {
          const data = await res.json();
          const districtsList = data.districts || data.wards || [];
          setAddressDistricts(Array.isArray(districtsList) ? districtsList : []);
        }
      } catch (err) {
        console.error('Error fetching address districts list:', err);
      } finally {
        setLoadingAddressDistricts(false);
      }
    };
    fetchAddressDistricts();
  }, [personal.addressProvinceCode]);

  // 3. Find addressDistrictCode when districts list or addressDistrictName changes
  useEffect(() => {
    if (addressDistricts.length === 0 || !personal.addressDistrictName || personal.addressDistrictCode) return;

    const matched = addressDistricts.find(d =>
      d.name.toLowerCase().includes(personal.addressDistrictName.toLowerCase()) ||
      personal.addressDistrictName.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matched) {
      setPersonal(prev => ({
        ...prev,
        addressDistrictCode: matched.code.toString(),
        addressDistrictName: matched.name
      }));
    }
  }, [addressDistricts, personal.addressDistrictName, personal.addressDistrictCode]);

  // 4. Find hometownProvinceCode when provinces list or hometownProvinceName changes
  useEffect(() => {
    if (provinces.length === 0 || !personal.hometownProvinceName || personal.hometownProvinceCode) return;

    const matched = provinces.find(p =>
      p.name.toLowerCase().includes(personal.hometownProvinceName.toLowerCase()) ||
      personal.hometownProvinceName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      setPersonal(prev => ({
        ...prev,
        hometownProvinceCode: matched.code.toString(),
        hometownProvinceName: matched.name
      }));
    }
  }, [provinces, personal.hometownProvinceName, personal.hometownProvinceCode]);

  // Handlers
  const handleHometownProvinceChange = useCallback((code: string) => {
    const name = provinces.find(p => p.code.toString() === code)?.name || '';
    setPersonal(prev => ({
      ...prev,
      hometownProvinceCode: code,
      hometownProvinceName: name,
    }));
  }, [provinces]);

  const handleAddressProvinceChange = useCallback(async (code: string) => {
    const name = provinces.find(p => p.code.toString() === code)?.name || '';
    setPersonal(prev => ({
      ...prev,
      addressProvinceCode: code,
      addressProvinceName: name,
      addressDistrictCode: '',
      addressDistrictName: '',
    }));
    setAddressDistricts([]);

    if (!code) return;

    setLoadingAddressDistricts(true);
    try {
      const res = await fetch(`/api/provinces?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        const districtsList = data.districts || data.wards || [];
        setAddressDistricts(Array.isArray(districtsList) ? districtsList : []);
      }
    } catch (err) {
      console.error('Error fetching address districts:', err);
    } finally {
      setLoadingAddressDistricts(false);
    }
  }, [provinces]);

  const handleAddressDistrictChange = useCallback((code: string) => {
    const name = addressDistricts.find(d => d.code.toString() === code)?.name || '';
    setPersonal(prev => ({
      ...prev,
      addressDistrictCode: code,
      addressDistrictName: name,
    }));
  }, [addressDistricts]);

  // Memoized Search Options
  const provinceOptions = useMemo(() => {
    return provinces.map(p => ({ value: p.code.toString(), label: p.name }));
  }, [provinces]);

  const addressDistrictOptions = useMemo(() => {
    return addressDistricts.map(d => ({ value: d.code.toString(), label: d.name }));
  }, [addressDistricts]);

  return (
    <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
      <div>
        <h2 className='font-bold text-lg text-foreground mb-1'>Thông tin cá nhân</h2>
        <p className='text-xs text-muted-foreground'>Vui lòng xác nhận thông tin liên lạc và cập nhật địa chỉ cư trú của bạn.</p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {/* Họ và tên (Pre-filled & Editable) */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Họ và tên <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={personal.name}
            onChange={(e) => setPersonal(prev => ({ ...prev, name: e.target.value }))}
            disabled={isReadOnly}
            className={cn('h-10', isReadOnly && 'bg-muted/40 cursor-not-allowed opacity-80')}
          />
        </div>

        {/* Email (Pre-filled & Editable) */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Email <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={personal.email}
            onChange={(e) => setPersonal(prev => ({ ...prev, email: e.target.value }))}
            disabled={isReadOnly}
            className={cn('h-10', isReadOnly && 'bg-muted/40 cursor-not-allowed opacity-80')}
          />
        </div>

        {/* Số điện thoại (Pre-filled & Editable) */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Số điện thoại <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={personal.phone}
            onChange={(e) => setPersonal(prev => ({ ...prev, phone: e.target.value }))}
            disabled={isReadOnly}
            placeholder='Vui lòng nhập số điện thoại'
            className={cn('h-10', isReadOnly && 'bg-muted/40 cursor-not-allowed opacity-80')}
          />
        </div>

        {/* Giới tính */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground block mb-2'>Giới tính <span className='text-red-500'>*</span></Label>
          <RadioGroup
            value={personal.gender}
            onValueChange={(val) => !isReadOnly && setPersonal(prev => ({ ...prev, gender: val }))}
            className='flex items-center space-x-6 h-10'
            disabled={isReadOnly}
          >
            {[
              { value: 'Nam', label: 'Nam' },
              { value: 'Nữ', label: 'Nữ' },
              { value: 'Khác', label: 'Khác' },
            ].map((opt) => (
              <div key={opt.value} className='flex items-center space-x-2'>
                <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} disabled={isReadOnly} className='h-4 w-4 text-primary border-muted-foreground' />
                <Label htmlFor={`gender-${opt.value}`} className={cn('text-sm font-medium', isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Năm sinh */}
        <div className='space-y-1.5'>
          <Label htmlFor='birthYear' className='text-xs text-muted-foreground'>Năm sinh <span className='text-red-500'>*</span></Label>
          <Input id='birthYear' placeholder='Ví dụ: 2002' className='h-10'
            value={personal.birthYear}
            onChange={e => setPersonal(prev => ({ ...prev, birthYear: e.target.value }))}
            maxLength={4} disabled={isReadOnly} />
        </div>

        {/* Quê quán - Tỉnh/Thành phố */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Quê quán - Tỉnh/Thành <span className='text-red-500'>*</span>
            {loadingProvinces && <IconLoader2 size={12} className='animate-spin text-primary' />}
          </Label>
          <SearchableSelect
            value={personal.hometownProvinceCode}
            onValueChange={handleHometownProvinceChange}
            options={provinceOptions}
            placeholder='Tìm và chọn Tỉnh/Thành'
            disabled={loadingProvinces || isReadOnly}
          />
        </div>

        {/* Nơi ở hiện tại - Tỉnh/Thành */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Nơi ở hiện tại - Tỉnh/Thành <span className='text-red-500'>*</span>
            {loadingProvinces && <IconLoader2 size={12} className='animate-spin text-primary' />}
          </Label>
          <SearchableSelect
            value={personal.addressProvinceCode}
            onValueChange={handleAddressProvinceChange}
            options={provinceOptions}
            placeholder='Tìm và chọn Tỉnh/Thành'
            disabled={loadingProvinces || isReadOnly}
          />
        </div>

        {/* Nơi ở hiện tại - Xã/Phường */}
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            Nơi ở hiện tại - Xã/Phường <span className='text-red-500'>*</span>
            {loadingAddressDistricts && <IconLoader2 size={12} className='animate-spin text-primary' />}
          </Label>
          <SearchableSelect
            value={personal.addressDistrictCode}
            onValueChange={handleAddressDistrictChange}
            options={addressDistrictOptions}
            placeholder='Tìm và chọn Xã/Phường'
            disabled={loadingAddressDistricts || !personal.addressProvinceCode || isReadOnly}
          />
        </div>

        {/* Địa chỉ chi tiết */}
        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='addressDetail' className='text-xs text-muted-foreground'>Nơi ở hiện tại - Địa chỉ chi tiết (Số nhà, ngõ/ngách, tên đường...) <span className='text-red-500'>*</span></Label>
          <Input id='addressDetail' placeholder='Ví dụ: Số 12, Ngõ 45, Đường Trần Hưng Đạo' className='h-10'
            value={personal.addressDetail}
            onChange={e => setPersonal(prev => ({ ...prev, addressDetail: e.target.value }))}
            disabled={isReadOnly} />
        </div>
      </div>
    </div>
  );
}
