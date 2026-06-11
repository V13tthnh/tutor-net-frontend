'use client';

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';

export default function HomeCenter() {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='relative h-8 w-8' asChild>
                    <Link href="/">
                        <Icons.home className='h-4 w-4' />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Xem website</p>
            </TooltipContent>
        </Tooltip>
    )
}