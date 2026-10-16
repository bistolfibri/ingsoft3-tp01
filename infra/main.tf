terraform {
  required_version = ">= 1.5"

  //Un provider es un plugin que sabe hablar con una API concreta:un intérprete de Neon y uno de Render
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

provider "neon" {}
provider "render" {}

//resource = quiero que exista una cosa de este tipo”. grafo de dependencias: se crean en orden 
//contenedor de todo 
resource "neon_project" "preprod" {
  name                      = "finfix-preprod"
  org_id                    = var.neon_org_id
  history_retention_seconds = 21600
}

//usuario de la base
resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod_owner"
}

//base que pertenece al rol 
resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

resource "render_web_service" "api" {
  name   = "finfix-api-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_api
      tag       = var.image_tag
    }
  }

  env_vars = {
    DB_HOST     = { value = neon_project.preprod.database_host }
    DB_NAME     = { value = neon_database.preprod.name }
    DB_USER     = { value = neon_role.preprod.name }
    DB_PASSWORD = { value = neon_role.preprod.password }
    DB_SSL      = { value = "true" }
  }
}

resource "render_web_service" "front" {
  name   = "finfix-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL  = { value = render_web_service.api.url }
    DNS_RESOLVER = { value = "8.8.8.8" }
    PORT         = { value = "80" }
  }
}

# Terraform crea la BASE, no el esquema: este paso aplica las tablas de la app
resource "terraform_data" "esquema" {
  triggers_replace = neon_database.preprod.id

  provisioner "local-exec" {
     command = "node ${path.module}/init-db.cjs > ${path.module}/init-db.log 2>&1"

    environment = {
      DB_HOST     = neon_project.preprod.database_host
      DB_NAME     = neon_database.preprod.name
      DB_USER     = neon_role.preprod.name
      DB_PASSWORD = neon_role.preprod.password
    }
  }
}