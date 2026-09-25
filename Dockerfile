# On part d'une image nginx légère
FROM nginx:alpine

# On copie les fichiers du frontend dans nginx
COPY frontend/ /usr/share/nginx/html

# On expose le port 80 (port par défaut de nginx)
EXPOSE 80
