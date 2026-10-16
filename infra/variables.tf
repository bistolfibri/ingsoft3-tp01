variable "neon_org_id" {
  type    = string
  default = "org-cold-field-15626518"
}
variable "image_repo_api" {
  default = "ghcr.io/bistolfibri/ingsoft3-tp01-backend"
}

variable "image_repo_front" {
  default = "ghcr.io/bistolfibri/ingsoft3-tp01-frontend"
}

variable "image_tag" {
  default = "sha-5fa39edff1239f7627d40255337760b4ac359726"
}

variable "region" {
  default = "ohio"
}