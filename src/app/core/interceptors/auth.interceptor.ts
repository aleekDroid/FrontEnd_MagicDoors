// src/app/core/interceptors/auth.interceptor.ts
/** * Interceptor para agregar el token de autenticación a las solicitudes HTTP.
 * Se inyecta el AuthService para obtener el token y se clona la solicitud
 * agregando el encabezado Authorization si el token está presente.
 * Si no hay token, la solicitud se envía sin modificaciones.
 * */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req); 
};
