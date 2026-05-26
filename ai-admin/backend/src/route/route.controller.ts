import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('路由')
@Controller('route')
export class RouteController {
  constructor(private routeService: RouteService) {}

  @Get('getConstantRoutes')
  getConstantRoutes() {
    return this.routeService.getConstantRoutes();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('getUserRoutes')
  getUserRoutes(@CurrentUser() user: { userId: string }) {
    return this.routeService.getUserRoutes(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('isRouteExist')
  isRouteExist(@Query('routeName') routeName: string) {
    return this.routeService.isRouteExist(routeName);
  }
}
