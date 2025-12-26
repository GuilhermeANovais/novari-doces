import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  searchGlobal(@Query('q') query: string, @Request() req: any) {
    return this.searchService.searchGlobal(query, req.user.organizationId);
  }
}
