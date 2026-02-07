# Estágio de Build
FROM node:18-alpine AS build

WORKDIR /app

# Copia dependências primeiro para otimizar cache do Docker
COPY package*.json ./
RUN npm ci

# Argumentos de build para injetar variáveis de ambiente do Vite
# Em SPAs (Vite/React), as variáveis precisam existir no momento do BUILD
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Disponibiliza as variáveis para o processo de build do Node
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Copia o código fonte e executa o build
COPY . .
RUN npm run build

# Estágio de Produção (Nginx)
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa configuração customizada
COPY nginx.conf /etc/nginx/conf.d/

# Copia os arquivos estáticos gerados no build anterior para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exposição da porta padrão
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
