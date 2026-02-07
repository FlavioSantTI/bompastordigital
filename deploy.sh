#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}>>> Iniciando processo de deploy do Bom Pastor Digital...${NC}"

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
    echo "ERRO: Arquivo .env não encontrado na raiz!"
    echo "Por favor, crie um arquivo .env baseado no .env.example com suas chaves do Supabase."
    exit 1
fi

# Carrega variáveis apenas para verificação (o docker-compose carrega automaticamente)
echo "Carregando variáveis de ambiente..."

echo -e "${GREEN}>>> Construindo a imagem (isso pode levar alguns minutos)...${NC}"
# Força o rebuild para garantir que as novas mudanças (e envs) sejam pegas
docker-compose build --no-cache

echo -e "${GREEN}>>> Subindo os containers...${NC}"
docker-compose up -d --remove-orphans

echo -e "${GREEN}>>> Deploy concluído com sucesso!${NC}"
echo "Acesse: https://bompastordigital.flaviosantiago.com.br"
