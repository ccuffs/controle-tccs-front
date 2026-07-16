# Etapa 1: Build do projeto
FROM node:20-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos essenciais para instalação e build
COPY package*.json yarn.lock ./

# Instala dependências
RUN yarn install --frozen-lockfile

# Copia o restante do código-fonte necessário para o build
COPY . .

# Executa o build de produção
RUN yarn build

# Etapa 2: Servindo com Nginx
FROM nginx:alpine

# Remove o conteúdo padrão do Nginx e copia o build gerado
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build/client /usr/share/nginx/html

# Expõe a porta padrão do Nginx
EXPOSE 80

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]