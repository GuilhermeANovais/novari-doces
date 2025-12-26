import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  create(@Body() createNoticeDto: CreateNoticeDto, @Request() req: any) {
    return this.noticesService.create(createNoticeDto, req.user.userId, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.noticesService.findAll(req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.noticesService.remove(id, req.user.organizationId);
  }
}
