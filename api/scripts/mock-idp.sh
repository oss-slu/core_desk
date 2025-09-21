#!/usr/bin/env bash

# Mock an IdP POSTing a minimal SAMLResponse to your ACS.
#
# Usage examples:
#   # Using values from env
#   BASE_URL="http://bore.pub:22427" EMAIL="jack.crane@slu.edu" bash api/scripts/mock-idp.sh
#
#   # Or pass variables inline
#   ACS="http://bore.pub:22427/assertion" RELAY_STATE="http://bore.pub:22427" \
#   EMAIL="user@example.com" FIRST="Test" LAST="User" bash api/scripts/mock-idp.sh
#
# Note: This generates an UNSIGNED SAMLResponse. To accept it, run the API with
#       SAML_SKIP_SIGNATURE=true so passport-saml does not require IdP signatures.

set -euo pipefail

# Inputs (env with defaults)
BASE_URL_DEFAULT="http://localhost:3030"
ACS="${ACS:-${BASE_URL:-$BASE_URL_DEFAULT}/assertion}"
RELAY_STATE="${RELAY_STATE:-${BASE_URL:-$BASE_URL_DEFAULT}}"
EMAIL="${EMAIL:-jack.crane@slu.edu}"
FIRST="${FIRST:-Jack}"
LAST="${LAST:-Crane}"
AUDIENCE="${AUDIENCE:-slu-open-project}"
ISSUER="${ISSUER:-urn:example:idp}"

echo "[mock-idp] Posting to ACS:        $ACS"
echo "[mock-idp] RelayState:            $RELAY_STATE"
echo "[mock-idp] Email/Name:            $EMAIL ($FIRST $LAST)"
echo "[mock-idp] Audience (SP Issuer):  $AUDIENCE"
echo "[mock-idp] IdP Issuer:            $ISSUER"

# Timestamps (BSD/GNU date compatible)
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if date -u -d '+5 minutes' +"%Y-%m-%dT%H:%M:%SZ" >/dev/null 2>&1; then
  IN5=$(date -u -d '+5 minutes' +"%Y-%m-%dT%H:%M:%SZ")
else
  IN5=$(date -u -v+5M +"%Y-%m-%dT%H:%M:%SZ")
fi

TMPDIR=${TMPDIR:-/tmp}
XML_FILE=$(mktemp "$TMPDIR/mock-idp.XXXXXX.xml")
trap 'rm -f "$XML_FILE"' EXIT

cat > "$XML_FILE" <<XML
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_id123" Version="2.0" IssueInstant="$NOW" Destination="$ACS">
  <saml:Issuer>$ISSUER</saml:Issuer>
  <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
  <saml:Assertion ID="_a123" IssueInstant="$NOW" Version="2.0">
    <saml:Issuer>$ISSUER</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">$EMAIL</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="$IN5" Recipient="$ACS"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="$NOW" NotOnOrAfter="$IN5">
      <saml:AudienceRestriction><saml:Audience>$AUDIENCE</saml:Audience></saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="$NOW">
      <saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"><saml:AttributeValue>$EMAIL</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"><saml:AttributeValue>$FIRST</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"><saml:AttributeValue>$LAST</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
XML

SAML_B64=$(openssl base64 -A -in "$XML_FILE")

echo "[mock-idp] Posting unsigned SAMLResponse (len: ${#SAML_B64})..."
curl -sS -X POST "$ACS" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "SAMLResponse=$SAML_B64" \
  --data-urlencode "RelayState=$RELAY_STATE" \
  -D -

echo "\n[mock-idp] Done."

