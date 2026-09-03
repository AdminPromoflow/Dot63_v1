<?php
class SingUp {
  public function handleSignUp(){
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    switch ($data["action"]) {
      case 'requestSignUpSupplier':
        $this->signUpSupplier($data);
        break;

      default:
        break;
    }

  }
  private function signUpSupplier($data){
    $connection = new Database();
    $user = new Users($connection);

    $user->setName($data['name']);
    $user->setEmail($data['email']);
    $user->setPassword($data['password']);
    $user->setSignupCategory("normal");
    $user->setPhone($data['phone']);
    $user->setCompanyName($data['company_name']);
    $user->setCountry($data['country']);
    $user->setCity($data['city']);
    $user->setAddressLine1($data['address_line1']);
    $user->setAddressLine2($data['address_line2']);
    $user->setPostcode($data['postcode']);

    $userCreated = $user->createUser();


    // Normaliza para evitar offset de null
    if (!is_array($userCreated)) {
      $userCreated = ['response' => false];
    }

    // Convierte a booleano seguro
    $boolSendEmail = filter_var(
      $userCreated['response'] ?? null,
      FILTER_VALIDATE_BOOLEAN,
      FILTER_NULL_ON_FAILURE
    );

    // Send a welcome notification only after the supplier was created.
    if ($boolSendEmail === true) {
      $emailSender = new EmailSender();
      $emailSender->setRecipientEmail($data['email']);
      $emailSender->setRecipientName($data['name']);
      $userCreated['notification_sent'] = $emailSender->sendEmailSupplierRegistration();

      if (!$userCreated['notification_sent']) {
        $userCreated['notification_warning'] = 'The supplier account was created, but the welcome email could not be sent.';
      }
    }

    echo json_encode ($userCreated);
  }


}


require_once __DIR__ . "/send_emails.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../../model/users.php";
$signUpClass = new SingUp(); //intancia = ponerle nombre a la variable
$signUpClass->handleSignUp();
?>
