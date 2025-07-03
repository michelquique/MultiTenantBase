#!/bin/bash

# Variables de configuración
BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "🚀 Testing Harassment Platform API"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir títulos
print_title() {
    echo -e "${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# Función para imprimir comandos
print_command() {
    echo -e "${YELLOW}💻 Comando:${NC}"
    echo "$1"
    echo ""
}

# Función para ejecutar curl y mostrar resultado
execute_curl() {
    local title="$1"
    local command="$2"
    
    print_title "$title"
    print_command "$command"
    
    echo -e "${GREEN}📤 Respuesta:${NC}"
    eval "$command"
    echo -e "\n"
}

# 1. HEALTH CHECK
execute_curl "Health Check" \
"curl -X GET '$BASE_URL/health' \
  -H 'Content-Type: application/json' \
  -s | jq ."

# 2. API ROOT
execute_curl "API Root Info" \
"curl -X GET '$BASE_URL/' \
  -H 'Content-Type: application/json' \
  -s | jq ."

# 3. LOGIN EXITOSO - Tenant Admin
execute_curl "Login Exitoso - Tenant Admin" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@empresademo.cl\",
    \"password\": \"Admin123!\",
    \"tenant_rut\": \"76.123.456-7\"
  }' \
  -s | jq ."

# Guardar token para siguientes requests
echo -e "${YELLOW}💾 Guardando token para siguientes requests...${NC}"
ACCESS_TOKEN=$(curl -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!",
    "tenant_rut": "76.123.456-7"
  }' \
  -s | jq -r '.data.tokens.access_token')

REFRESH_TOKEN=$(curl -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!",
    "tenant_rut": "76.123.456-7"
  }' \
  -s | jq -r '.data.tokens.refresh_token')

echo "Access Token guardado: ${ACCESS_TOKEN:0:50}..."
echo ""

# 4. LOGIN EXITOSO - Usuario RRHH
execute_curl "Login Exitoso - Usuario RRHH" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"ana.garcia@empresademo.cl\",
    \"password\": \"Password123!\",
    \"tenant_rut\": \"76.123.456-7\"
  }' \
  -s | jq ."

# 5. LOGIN EXITOSO - Usuario Empleado
execute_curl "Login Exitoso - Usuario Empleado" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"maria.rodriguez@empresademo.cl\",
    \"password\": \"Password123!\",
    \"tenant_rut\": \"76.123.456-7\"
  }' \
  -s | jq ."

# 6. LOGIN SEGUNDO TENANT
execute_curl "Login Segundo Tenant" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@otraempresa.cl\",
    \"password\": \"Admin123!\",
    \"tenant_rut\": \"77.987.654-3\"
  }' \
  -s | jq ."

# 7. VERIFICAR TOKEN
execute_curl "Verificar Token" \
"curl -X GET '$API_URL/auth/verify' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -s | jq ."

# 8. OBTENER INFORMACIÓN DEL USUARIO
execute_curl "Información del Usuario Actual" \
"curl -X GET '$API_URL/auth/me' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -s | jq ."

# 9. REFRESH TOKEN
execute_curl "Refresh Token" \
"curl -X POST '$API_URL/auth/refresh' \
  -H 'Content-Type: application/json' \
  -d '{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }' \
  -s | jq ."

# 10. LOGOUT
execute_curl "Logout" \
"curl -X POST '$API_URL/auth/logout' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -s | jq ."

echo -e "${RED}❌ CASOS DE ERROR${NC}"
echo "================="

# 11. LOGIN CON EMAIL INCORRECTO
execute_curl "Error - Email Incorrecto" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"usuario_inexistente@empresademo.cl\",
    \"password\": \"Password123!\",
    \"tenant_rut\": \"76.123.456-7\"
  }' \
  -s | jq ."

# 12. LOGIN CON CONTRASEÑA INCORRECTA
execute_curl "Error - Contraseña Incorrecta" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@empresademo.cl\",
    \"password\": \"PasswordIncorrecta\",
    \"tenant_rut\": \"76.123.456-7\"
  }' \
  -s | jq ."

# 13. LOGIN CON TENANT INCORRECTO
execute_curl "Error - Tenant Incorrecto" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@empresademo.cl\",
    \"password\": \"Admin123!\",
    \"tenant_rut\": \"99.999.999-9\"
  }' \
  -s | jq ."

# 14. LOGIN CON DATOS INVÁLIDOS
execute_curl "Error - Datos Inválidos" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"email_invalido\",
    \"password\": \"123\",
    \"tenant_rut\": \"rut_invalido\"
  }' \
  -s | jq ."

# 15. ACCESO SIN TOKEN
execute_curl "Error - Acceso Sin Token" \
"curl -X GET '$API_URL/auth/me' \
  -H 'Content-Type: application/json' \
  -s | jq ."

# 16. TOKEN INVÁLIDO
execute_curl "Error - Token Inválido" \
"curl -X GET '$API_URL/auth/me' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token_invalido' \
  -s | jq ."

# 17. REFRESH TOKEN INVÁLIDO
execute_curl "Error - Refresh Token Inválido" \
"curl -X POST '$API_URL/auth/refresh' \
  -H 'Content-Type: application/json' \
  -d '{
    \"refresh_token\": \"refresh_token_invalido\"
  }' \
  -s | jq ."

# 18. AISLAMIENTO MULTI-TENANT (Usuario de un tenant intentando acceder con RUT de otro)
execute_curl "Error - Aislamiento Multi-Tenant" \
"curl -X POST '$API_URL/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@empresademo.cl\",
    \"password\": \"Admin123!\",
    \"tenant_rut\": \"77.987.654-3\"
  }' \
  -s | jq ."

echo -e "${GREEN}✅ TESTING COMPLETADO${NC}"
echo "===================="
echo ""
echo -e "${BLUE}📝 RESUMEN DE USUARIOS DISPONIBLES:${NC}"
echo ""
echo "🏢 Tenant 1: Empresa Demo S.A. (RUT: 76.123.456-7)"
echo "   👤 admin@empresademo.cl / Admin123! (Tenant Admin)"
echo "   👤 ana.garcia@empresademo.cl / Password123! (RRHH)"
echo "   👤 carlos.lopez@empresademo.cl / Password123! (Investigador)"
echo "   👤 maria.rodriguez@empresademo.cl / Password123! (Empleado)"
echo "   👤 juan.perez@empresademo.cl / Password123! (Empleado)"
echo ""
echo "🏢 Tenant 2: Otra Empresa Ltda. (RUT: 77.987.654-3)"
echo "   👤 admin@otraempresa.cl / Admin123! (Tenant Admin)"
echo ""
echo -e "${YELLOW}💡 TIP: Guarda los tokens devueltos para usar en siguientes requests${NC}"