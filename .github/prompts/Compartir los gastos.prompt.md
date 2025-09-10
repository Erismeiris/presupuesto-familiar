---
mode: agent
---
Quiero implementar una sección donde el usuario pueda invitar a otros a compartir gastos.  
Necesito que me generes:

1. Un componente standalone llamado `InviteExpenseComponent` que:
   - Muestre un checkbox para activar “compartir gastos”
   - Al marcarlo, muestre un input para ingresar el correo del usuario invitado
   - Al enviar el correo, llame al endpoint `/invite-expense` del backend
   - Si el usuario existe, muestre un mensaje de “invitación enviada, pendiente de aprobación”
   - Si no existe, muestre un modal preguntando si desea enviar una invitación por correo

2. Un servicio `ExpenseInvitationService` que:
   - Tenga métodos `sendInvitation(email: string)` y `respondInvitation(id: string, response: 'accepted' | 'rejected')`
   - Use `HttpClient` con `{ withCredentials: true }` si es necesario

3. Un componente `NotificationsComponent` que:
   - Muestre una lista de invitaciones pendientes para el usuario actual
   - Permita aceptar o rechazar cada una
   - Al aceptar, llame a `respondInvitation()` y actualice la vista

4. Opcional: usar `BehaviorSubject` para manejar el estado de invitaciones en el servicio

Usar buenas prácticas de UX:
- Validar formato de correo
- Mostrar mensajes de éxito/error
- Evitar duplicados en la lista de invitaciones
