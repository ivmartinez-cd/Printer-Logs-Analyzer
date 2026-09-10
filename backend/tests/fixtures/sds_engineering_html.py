"""Fixtures de HTML del portal HP SDS para la cola de incidentes de ingeniería.

Estructura y atributos (data-entity-id, data-sort-value, clases, nombres de
inputs) verificados contra el portal real en vivo. Nombres de cliente, seriales
e IDs están anonimizados; el token del link KaaS está recortado.
"""

from __future__ import annotations

ADVISORIES_LIST_HTML = """
<html><body>
<table class="data entity-list engineering-advisories-list stickyHead">
  <thead>
    <tr>
      <th>Cliente</th><th>Monitor</th><th>Dispositivo</th><th>Modelo (HP)</th>
      <th>Versión del firmware</th><th>Estado</th><th>Gravedad</th><th>Tipo</th>
      <th>Código</th><th>Probabilidad</th><th>Plazo en días</th>
      <th>Mediana de días hasta el fallo</th><th>Creado</th><th>Última actualización</th>
      <th>Seleccionar</th>
    </tr>
  </thead>
  <tbody>
    <tr data-entity-id="900001">
      <td><a href="/PortalWeb/customers/9001" target="_blank" data-entity-id="9001" class="entity-name customer">Cliente Demo SA</a></td>
      <td><a href="/PortalWeb/contracts/20001" target="_blank" data-entity-id="20001" class="entity-name contract">demo1</a></td>
      <td><a href="/PortalWeb/devices/100001/hpsmart" target="_blank" data-entity-id="100001" class="entity-name device">MXBCT0000A</a></td>
      <td>HP COLOR LASERJET MFP X57945</td>
      <td>2508402_000098</td>
      <td><a class="ajax view-link" href="/PortalWeb/devices/100001/hpsmart/actionevents/900001?closeUrl=NONE">New</a></td>
      <td>Medium</td>
      <td>EngineAnalysis</td>
      <td>TriageImageFormationAreaNoise</td>
      <td></td>
      <td></td>
      <td></td>
      <td data-sort-value="2026-09-08T03:45:47.028Z">08-sep-2026 0:45:47</td>
      <td data-sort-value="2026-09-08T03:45:47.028Z">08-sep-2026 0:45:47</td>
      <td class="row-selector"><input type="checkbox" name="a" value="100001#900001"></td>
    </tr>
    <tr data-entity-id="900002">
      <td><a href="/PortalWeb/customers/9002" target="_blank" data-entity-id="9002" class="entity-name customer">Cliente Demo Dos SRL</a></td>
      <td><a href="/PortalWeb/contracts/20002" target="_blank" data-entity-id="20002" class="entity-name contract">demo2</a></td>
      <td><a href="/PortalWeb/devices/100002/hpsmart" target="_blank" data-entity-id="100002" class="entity-name device">MXBCT0000B</a></td>
      <td>HP LASERJET E50145</td>
      <td>2507050_043104</td>
      <td><a class="ajax view-link" href="/PortalWeb/devices/100002/hpsmart/actionevents/900002?closeUrl=NONE">Open</a></td>
      <td>High</td>
      <td>Predictive</td>
      <td>TriageFuser</td>
      <td>65%</td>
      <td>90</td>
      <td>8</td>
      <td data-sort-value="2026-06-24T19:51:56.000Z">24-jun-2026 19:51:56</td>
      <td data-sort-value="2026-08-26T10:26:22.000Z">26-ago-2026 10:26:22</td>
      <td class="row-selector"><input type="checkbox" name="a" value="100002#900002"></td>
    </tr>
  </tbody>
</table>
</body></html>
"""

# Sin <thead> — fuerza el fallback posicional del parser.
ADVISORIES_LIST_HTML_NO_THEAD = ADVISORIES_LIST_HTML.replace(
    ADVISORIES_LIST_HTML[ADVISORIES_LIST_HTML.index("<thead>") : ADVISORIES_LIST_HTML.index("</thead>") + len("</thead>")],
    "",
)

DETAIL_EXPERTRULES_HTML = """
<content><![CDATA[
<form action="/PortalWeb/devices/100001/hpsmart/actionevents/900001/edit" class=" data only-ajax" method="post">
<input type="hidden" name="__csrftoken" value="demo-csrf-token"/>
<input type="hidden" name="hpActionId" value="demo-action-uuid-0001"/>
<div class="captioned-table-wrapper">
<table class="data">
<caption>Detalles de la notificación</caption>
<tbody>
<tr><th>ID de acción de HP</th><td>demo-action-uuid-0001</td></tr>
<tr><th>Estado actual</th><td>
<select id="stateSelector" name="state"><option selected value="Open">Abierto</option>
<option value="Postponed">Pospuesto</option>
<option value="ClosedIgnored">Cerrado - Ignorado</option>
<option value="ClosedFixedAsDesigned">Cerrado - Fijado como designado</option>
<option value="ClosedIncorrectAction">Cerrado - Acción incorrecta</option>
<option value="ClosedCanceled">Cerrado - Cancelado</option>
<option value="Closed">Cerrado</option>
</select></td></tr>
<tr><th>Tipo</th><td>EngineAnalysis</td></tr>
<tr><th>Código</th><td>TriageImageFormationAreaNoise</td></tr>
<tr><th>Gravedad</th><td>Medium</td></tr>
<tr><th>Creado</th><td>08-sep-2026 0:45:47</td></tr>
<tr><th>Última actualización</th><td>08-sep-2026 0:45:47</td></tr>
<tr><th>Descripción</th><td>Troubleshoot abnormal noises coming from the image formation area of the printer.</td></tr>
<tr><th>Más información</th><td><a href="https://kaas.hpcloud.hp.com/doc?id=DEMO" target="_blank">Triage image formation area noise</a></td></tr>
<tr><th>Piezas</th><td>
<li>527H0MC; HP LaserJet Managed Image Transfer Belt</li>
<li>RM2-3497-000CN; ASSY-MAIN DRIVE</li>
</td></tr>
<tr><th>Versión del firmware</th><td>2508402_000098</td></tr>
<tr><th>Historial de estados</th><td>
<div><table id="sdsActionEventHistory">
<tr><th>Fecha</th><th>Estado</th><th>Usuario</th><th>Comentario</th></tr>
<tr><td class="noWrap">08-sep-2026 0:45:47</td><td>Open</td><td class="noWrap">[HP]</td><td></td></tr>
</table></div>
</td></tr>
<tr><th>Añadir comentario</th><td><textarea name="comment" id="commentBox" maxlength="1000"></textarea></td></tr>
</tbody>
</table>
</div>
</form>
]]></content>
"""

DETAIL_PREDICTIVE_HTML = """
<content><![CDATA[
<form action="/PortalWeb/devices/100002/hpsmart/actionevents/900002/edit" class=" data only-ajax" method="post">
<input type="hidden" name="__csrftoken" value="demo-csrf-token-2"/>
<input type="hidden" name="hpActionId" value="demo-action-uuid-0002"/>
<table class="data">
<tbody>
<tr><th>ID de acción de HP</th><td>demo-action-uuid-0002</td></tr>
<tr><th>Estado actual</th><td><select name="state"><option selected value="Closed">Cerrado</option>
<option value="ClosedCanceled">Cerrado - Cancelado</option></select></td></tr>
<tr><th>Tipo</th><td>Predictive</td></tr>
<tr><th>Código</th><td>TriageFuser</td></tr>
<tr><th>Gravedad</th><td>Medium</td></tr>
<tr><th>Creado</th><td>24-jun-2026 19:51:56</td></tr>
<tr><th>Última actualización</th><td>26-jun-2026 10:26:22</td></tr>
<tr><th>Descripción</th><td>Fuser delivery stay jam.</td></tr>
<tr><th>Probabilidad</th><td>65%</td></tr>
<tr><th>Plazo en días</th><td>90</td></tr>
<tr><th>Mediana de días hasta el fallo</th><td>8.42</td></tr>
<tr><th>Piezas</th><td>
<li>RM2-2585-000CN; Assy-Fixing 110V</li>
<li>RM2-5692-000CN; Fuser Assembly 220V</li>
</td></tr>
<tr><th>Versión del firmware</th><td>2507050_043104</td></tr>
<tr><th>Historial de estados</th><td>
<div><table id="sdsActionEventHistory">
<tr><th>Fecha</th><th>Estado</th><th>Usuario</th><th>Comentario</th></tr>
<tr><td class="noWrap">24-jun-2026 19:51:56</td><td>Open</td><td class="noWrap">[HP]</td><td></td></tr>
<tr><td class="noWrap">26-jun-2026 10:26:22</td><td>ClosedCanceled</td><td class="noWrap">Demo Tech</td><td>Ya resuelto</td></tr>
</table></div>
</td></tr>
</tbody>
</table>
</form>
]]></content>
"""

SESSION_EXPIRED_HTML = """
<html><head><title>Session Expired</title></head>
<body>
<div class="banner"><span class="bannerText">Session Expired</span></div>
<div class="content">Your session has expired. Please log in again.</div>
</body></html>
"""
