# 🚀 Configuración del Servicio Systemd

Esta guía explica cómo configurar la aplicación para que se inicie automáticamente al arrancar el servidor Linux.

## 📋 Requisitos Previos

- Servidor Linux con systemd (Ubuntu, Debian, CentOS, etc.)
- Acceso root o sudo
- Aplicación funcionando correctamente con `npm run dev`
- Archivo `.env` configurado correctamente

---

## ⚡ Instalación Rápida (Recomendado)

Ejecuta el script de instalación automática:

```bash
cd /Proyecto/app_licitaciones
sudo bash install-service.sh
```

Este script:
- ✅ Compila la aplicación para producción
- ✅ Configura el servicio systemd
- ✅ Habilita inicio automático al arrancar
- ✅ Inicia el servicio inmediatamente

---

## 🔧 Instalación Manual

Si prefieres instalar manualmente:

### 1. Compilar la aplicación

```bash
cd /Proyecto/app_licitaciones
npm run build
```

### 2. Copiar el archivo de servicio

```bash
sudo cp licitaciones.service /etc/systemd/system/
```

### 3. Editar el archivo de servicio (si es necesario)

```bash
sudo nano /etc/systemd/system/licitaciones.service
```

Asegúrate de que las rutas sean correctas:
- `WorkingDirectory=/Proyecto/app_licitaciones`
- `EnvironmentFile=/Proyecto/app_licitaciones/.env`

### 4. Habilitar e iniciar el servicio

```bash
# Recargar configuración de systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable licitaciones.service

# Iniciar el servicio
sudo systemctl start licitaciones.service
```

---

## 📊 Comandos Útiles

### Ver estado del servicio
```bash
sudo systemctl status licitaciones
```

### Iniciar el servicio
```bash
sudo systemctl start licitaciones
```

### Detener el servicio
```bash
sudo systemctl stop licitaciones
```

### Reiniciar el servicio
```bash
sudo systemctl restart licitaciones
```

### Ver logs en tiempo real
```bash
sudo journalctl -u licitaciones -f
```

### Ver logs completos
```bash
sudo journalctl -u licitaciones -n 100 --no-pager
```

### Deshabilitar inicio automático
```bash
sudo systemctl disable licitaciones
```

### Verificar si está habilitado
```bash
sudo systemctl is-enabled licitaciones
```

---

## 🔍 Troubleshooting

### El servicio no inicia

1. **Verificar logs:**
   ```bash
   sudo journalctl -u licitaciones -n 50 --no-pager
   ```

2. **Verificar que el build existe:**
   ```bash
   ls -la /Proyecto/app_licitaciones/.next
   ```

3. **Verificar archivo .env:**
   ```bash
   cat /Proyecto/app_licitaciones/.env
   ```

4. **Probar manualmente:**
   ```bash
   cd /Proyecto/app_licitaciones
   npm run start:prod
   ```

### El servicio se reinicia constantemente

```bash
# Ver logs de errores
sudo journalctl -u licitaciones -p err -n 50

# Ver todas las salidas
sudo journalctl -u licitaciones --since "10 minutes ago"
```

### Cambiar configuración del servicio

```bash
# Editar el servicio
sudo nano /etc/systemd/system/licitaciones.service

# Recargar y reiniciar
sudo systemctl daemon-reload
sudo systemctl restart licitaciones
```

---

## 🔐 Seguridad

### Ejecutar como usuario no-root (Recomendado)

Para mayor seguridad, crea un usuario específico:

```bash
# Crear usuario sin shell
sudo useradd -r -s /bin/false licitaciones

# Cambiar permisos del proyecto
sudo chown -R licitaciones:licitaciones /Proyecto/app_licitaciones

# Editar el servicio
sudo nano /etc/systemd/system/licitaciones.service
```

Cambia la línea `User=root` por `User=licitaciones`

```bash
# Recargar y reiniciar
sudo systemctl daemon-reload
sudo systemctl restart licitaciones
```

---

## 📈 Monitoreo

### Ver uso de recursos
```bash
# CPU y memoria del servicio
systemctl status licitaciones
```

### Ver todos los servicios activos
```bash
systemctl list-units --type=service --state=running
```

---

## 🔄 Actualizar la Aplicación

Cuando actualices el código:

```bash
cd /Proyecto/app_licitaciones

# Pull de cambios
git pull origin main

# Instalar dependencias (si cambiaron)
npm install

# Rebuild
npm run build

# Reiniciar servicio
sudo systemctl restart licitaciones

# Verificar que inició correctamente
sudo systemctl status licitaciones
```

---

## 📝 Configuración Avanzada

### Cambiar puerto

Edita el servicio y cambia:
```ini
Environment=PORT=3001
```

### Ajustar reinicio automático

```ini
# Reiniciar siempre
Restart=always

# Esperar 10 segundos antes de reintentar
RestartSec=10

# Máximo de reintentos (opcional)
StartLimitBurst=5
```

### Logs personalizados

```ini
# Guardar logs en archivo
StandardOutput=append:/var/log/licitaciones/output.log
StandardError=append:/var/log/licitaciones/error.log
```

No olvides crear el directorio:
```bash
sudo mkdir -p /var/log/licitaciones
sudo chown licitaciones:licitaciones /var/log/licitaciones
```

---

## ✅ Verificación Final

Después de instalar, verifica:

1. **El servicio está activo:**
   ```bash
   sudo systemctl is-active licitaciones
   # Debería mostrar: active
   ```

2. **Está habilitado para inicio automático:**
   ```bash
   sudo systemctl is-enabled licitaciones
   # Debería mostrar: enabled
   ```

3. **La aplicación responde:**
   ```bash
   curl http://localhost:3001
   # Debería devolver HTML
   ```

4. **Prueba de reinicio:**
   ```bash
   sudo reboot
   # Después del reinicio, verificar:
   sudo systemctl status licitaciones
   ```

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `sudo journalctl -u licitaciones -n 100`
2. Verifica el estado: `sudo systemctl status licitaciones`
3. Prueba manualmente: `npm run start:prod`
4. Revisa el archivo .env

---

**¡El servicio está configurado! 🎉**

La aplicación ahora se iniciará automáticamente cada vez que el servidor arranque, incluso después de cortes de luz.
